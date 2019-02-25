"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const puppeteer = require("puppeteer");
const index_document_1 = require("./index-document");
const sync_metadata_1 = require("../db/sync-metadata");
function logWarning(warning) {
    console.log(`[WARNING] ${warning}`);
}
async function extractData(files, metadata_extractor, extractors, slug) {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]
    });
    const page = await browser.newPage();
    page.on('console', (msg) => {
        msg = msg.text();
        if (msg.slice(0, 7) === 'WARNING')
            logWarning(msg.slice(7));
        else
            console.log('From page: ', msg);
    });
    await page.goto('http://localhost:4000');
    await page.addScriptTag({ path: './node_modules/xmlio/dist/bundle.js' });
    const output = await page.evaluate(async function (xmlFiles, metadata_extractor, extractorsJson, slug) {
        function fetchXml(url) {
            return new Promise((resolve, reject) => {
                var xhr = new XMLHttpRequest;
                xhr.open('GET', url);
                xhr.responseType = 'document';
                xhr.overrideMimeType('text/xml');
                xhr.onload = function () {
                    if (xhr.readyState === xhr.DONE && xhr.status === 200) {
                        if (xhr.responseXML == null) {
                            reject(`Fetching XML of "${url}" failed`);
                            return;
                        }
                        resolve(xhr.responseXML);
                    }
                };
                xhr.send();
            });
        }
        const esData = [];
        for (const file of xmlFiles) {
            try {
                const xmlRoot = await fetchXml(`/api/xml/${slug}/${file}`);
                const xmlio = await new XMLio(xmlRoot);
                const entryData = [{}, {}, ''];
                if (metadata_extractor != null) {
                    const extractMetadata = new Function(`return ${metadata_extractor}`);
                    const meta = extractMetadata()(xmlio);
                    entryData[0] = meta
                        .reduce((prev, curr) => {
                        let [key, value] = curr;
                        if (key !== 'id')
                            key = `m_${key}`;
                        if (prev.hasOwnProperty(key)) {
                            if (!Array.isArray(prev[key]))
                                prev[key] = [prev[key]];
                            prev[key].push(value);
                        }
                        else
                            prev[key] = value;
                        return prev;
                    }, {});
                }
                entryData[0].m__filebasename = file.slice(0, -4);
                if (!entryData[0].hasOwnProperty('id'))
                    entryData[0].id = file.slice(0, -4);
                const extractors = JSON.parse(extractorsJson);
                if (extractors != null) {
                    for (const extractor of extractors) {
                        let nodes = xmlio
                            .select(extractor.selector)
                            .export({ type: 'data', deep: extractor.idAttribute == null });
                        if (nodes == null)
                            continue;
                        if (!Array.isArray(nodes))
                            nodes = [nodes];
                        const ids = nodes.map((node) => extractor.idAttribute == null ?
                            node.children.map((c) => typeof c === 'string' ? c : '').join('') :
                            node.attributes[extractor.idAttribute]);
                        entryData[1][`t_${extractor.id}`] = [...new Set(ids)];
                    }
                }
                entryData[2] = xmlio.export({ type: 'text' });
                esData.push(entryData);
            }
            catch (err) {
                console.log(err);
            }
        }
        return esData;
    }, files, metadata_extractor, JSON.stringify(extractors), slug);
    browser.close();
    return output;
}
async function main(slug, metadata_extractor, extractors) {
    const files = fs.readdirSync(`./public/xml/${slug}`);
    let documentsData;
    try {
        documentsData = await extractData(files, metadata_extractor, extractors, slug);
    }
    catch (err) {
        console.log("ANOTHER ERRR", err);
    }
    let metadataKeys = new Set();
    for (const [metadata, textData] of documentsData) {
        metadataKeys = new Set([
            ...metadataKeys,
            ...new Set(Object.keys(metadata)),
            ...new Set(Object.keys(textData))
        ]);
    }
    const metadata = await sync_metadata_1.default(slug, [...metadataKeys]);
    await index_document_1.deleteIndex(slug);
    await index_document_1.createIndex(slug, metadata);
    for (const docData of documentsData) {
        console.log(`Indexing ${docData[0].id}`);
        await index_document_1.default(slug, docData);
    }
}
exports.default = main;
