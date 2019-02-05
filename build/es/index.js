"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const puppeteer = require("puppeteer");
const index_document_1 = require("./index-document");
function logWarning(warning) {
    console.log(`[WARNING] ${warning}`);
}
async function extractMetadata(files, metadata_extractor, baseDir) {
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
    await page.addScriptTag({
        path: './node_modules/xmlio/dist/bundle.js'
    });
    const output = await page.evaluate(async function (xmlFiles, metadata_extractor, slug) {
        function fetchXml(url) {
            return new Promise((resolve, reject) => {
                var xhr = new XMLHttpRequest;
                xhr.open('GET', url);
                xhr.responseType = 'document';
                xhr.overrideMimeType('text/xml');
                xhr.onload = function () {
                    if (xhr.readyState === xhr.DONE && xhr.status === 200) {
                        resolve(xhr.responseXML.documentElement);
                    }
                };
                xhr.onerror = function () { reject('this does not work 1'); };
                xhr.onabort = function () { reject('this does not work 2'); };
                xhr.ontimeout = function () { reject('this does not work 3'); };
                xhr.send();
            });
        }
        const esData = [];
        for (const file of xmlFiles) {
            const xmlRoot = await fetchXml(`/api/xml/${slug}/${file}`);
            const xmlio = await new XMLio(xmlRoot);
            const extractMetadata = new Function(`return ${metadata_extractor}`);
            const meta = extractMetadata()(xmlio);
            const entryData = meta.reduce((prev, curr) => {
                prev[curr[0]] = curr[1];
                return prev;
            }, {});
            entryData.text = xmlio.export({ type: 'text' });
            esData.push(entryData);
        }
        return esData;
    }, files, metadata_extractor, baseDir);
    browser.close();
    return output;
}
async function main(slug, metadata_extractor) {
    const files = fs.readdirSync(`./public/xml/${slug}`);
    let metadataKeys = new Set();
    let esData;
    try {
        esData = await extractMetadata(files, metadata_extractor, slug);
    }
    catch (err) {
        console.log("ANOTHER ERRR", err);
    }
    for (const data of esData) {
        metadataKeys = new Set([...metadataKeys, ...new Set(Object.keys(data))]);
    }
    await index_document_1.deleteIndex(slug);
    await index_document_1.createIndex(slug, [...metadataKeys]);
    for (const data of esData) {
        console.log(`Indexing ${data.id}`);
        await index_document_1.default(data);
    }
    return [...metadataKeys].filter(k => k !== 'text');
}
exports.default = main;
