"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const es = require("elasticsearch");
const client = new es.Client({
    host: 'localhost:9200'
});
async function deleteIndex(slug) {
    try {
        await client.indices.delete({ index: slug });
    }
    catch (err) {
        console.log('deleteIndex', err);
    }
}
exports.deleteIndex = deleteIndex;
async function createIndex(slug, metadataKeys) {
    const properties = metadataKeys.reduce((prev, curr) => {
        const type = curr === 'text' ? 'text' : 'keyword';
        prev[curr] = { type };
        return prev;
    }, {});
    try {
        await client.indices.create({
            index: slug,
            body: {
                mappings: {
                    doc: {
                        properties
                    }
                }
            }
        });
    }
    catch (err) {
        console.log('createIndex', err);
    }
}
exports.createIndex = createIndex;
async function indexDocument(data) {
    try {
        await client.index({
            id: data.id,
            index: 'gekaaptebrieven',
            type: 'doc',
            body: data
        });
    }
    catch (err) {
        console.log('indexDocument', err);
    }
}
exports.default = indexDocument;
