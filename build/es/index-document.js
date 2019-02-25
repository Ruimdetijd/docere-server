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
async function createIndex(slug, metadata) {
    const properties = metadata.reduce((prev, curr) => {
        prev[curr.slug] = { type: curr.es_data_type === 'null' ? 'keyword' : curr.es_data_type };
        return prev;
    }, {});
    properties.text = { type: 'text' };
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
async function indexDocument(slug, docData) {
    const [metadata, textData, text] = docData;
    try {
        await client.index({
            id: metadata.id,
            index: slug,
            type: 'doc',
            body: Object.assign({}, metadata, textData, { text })
        });
    }
    catch (err) {
        console.log('indexDocument', err);
    }
}
exports.default = indexDocument;
