"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const puppeteer = require("puppeteer");
const index_document_1 = require("./index-document");
const sync_metadata_1 = require("../db/sync-metadata");
function logWarning(warning) {
    console.log(`[WARNING] ${warning}`);
}
async function extractData(files, splitter, metadata_extractor, facsimile_extractor, extractors, slug) {
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
    const output = await page.evaluate(async function (xmlFiles, splitter, metadata_extractor, facsimile_extractor, extractorsJson, slug) {
        let entries = [];
        const serializer = new XMLSerializer();
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
        for (const fileName of xmlFiles) {
            const entryData = { fileName: null, metadata: {}, textdata: {}, text: null, xml: null, xmlDoc: null };
            const xmlDoc = await fetchXml(`/api/xml-source/${slug}/${fileName}.xml`);
            entryData.fileName = fileName;
            entryData.xmlDoc = xmlDoc;
            entries.push(entryData);
        }
        if (splitter != null) {
            const tmpData = [];
            for (const entryData of entries) {
                const xmlio = await new XMLio(entryData.xmlDoc);
                const splitXML = new Function(`return ${splitter}`);
                const xmlDocs = splitXML()(xmlio);
                for (const [index, xmlDoc] of xmlDocs.entries()) {
                    const nextEntry = { fileName: null, metadata: {}, textdata: {}, text: null, xml: null, xmlDoc: null };
                    nextEntry.xmlDoc = xmlDoc;
                    nextEntry.fileName = `${entryData.fileName}_${index}`;
                    tmpData.push(nextEntry);
                }
                entries = tmpData;
            }
        }
        for (const entry of entries) {
            const xmlio = await new XMLio(entry.xmlDoc);
            if (metadata_extractor != null) {
                const extractMetadata = new Function(`return ${metadata_extractor}`);
                const meta = extractMetadata()(xmlio, entry.fileName);
                entry.metadata = meta
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
            entry.metadata.__filebasename = entry.fileName;
            if (!entry.metadata.hasOwnProperty('id'))
                entry.metadata.id = entry.fileName;
            const extractors = extractorsJson != null ? JSON.parse(extractorsJson) : [];
            if (extractors.length) {
                for (const extractor of extractors) {
                    let nodes = xmlio
                        .select(extractor.selector)
                        .export({ type: 'data', deep: extractor.idAttribute == null });
                    if (nodes == null)
                        continue;
                    if (!Array.isArray(nodes))
                        nodes = [nodes];
                    const ids = nodes.map((node) => {
                        return extractor.idAttribute == null ?
                            node.children.map((c) => typeof c === 'string' ? c : '').join('') :
                            node.attributes[extractor.idAttribute];
                    });
                    entry.textdata[`t_${extractor.id}`] = [...new Set(ids)];
                }
            }
            entry.text = xmlio.export({ type: 'text' });
            entry.xml = serializer.serializeToString(entry.xmlDoc);
        }
        return entries;
    }, files, splitter, metadata_extractor, facsimile_extractor, JSON.stringify(extractors), slug);
    browser.close();
    return output;
}
async function main(slug, splitter, metadata_extractor, facsimile_extractor, extractors) {
    const files = fs.readdirSync(`./public/xml-source/${slug}`);
    let entries;
    try {
        entries = await extractData(files.map(f => path.basename(f, '.xml')), splitter, metadata_extractor, facsimile_extractor, extractors, slug);
    }
    catch (err) {
        console.log("ANOTHER ERRR", err);
    }
    let metadataKeys = new Set();
    for (const entry of entries) {
        metadataKeys = new Set([
            ...metadataKeys,
            ...new Set(Object.keys(entry.metadata)),
            ...new Set(Object.keys(entry.textdata))
        ]);
    }
    const metadata = await sync_metadata_1.default(slug, [...metadataKeys]);
    await index_document_1.deleteIndex(slug);
    await index_document_1.createIndex(slug, metadata);
    const outputDir = `./public/xml/${slug}`;
    fs.emptyDirSync(outputDir);
    for (const entry of entries) {
        console.log(`Indexing ${entry.fileName}, with ID: ${entry.metadata.id}`);
        await index_document_1.default(slug, entry);
        fs.writeFileSync(`${outputDir}/${entry.fileName}.xml`, entry.xml, 'utf8');
    }
}
exports.default = main;
