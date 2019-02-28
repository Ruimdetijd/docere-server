import * as es from 'elasticsearch'
import { Entry } from './index'

const client = new es.Client({
	host: 'localhost:9200'
})

export async function deleteIndex(slug: string) {
	try {
		await client.indices.delete({ index: slug })	
	} catch (err) {
		console.log('deleteIndex', err)	
	}
}

// TODO replace any with MetadataField
export async function createIndex(slug: string, metadata: any[]) {
	const properties = metadata.reduce((prev, curr) => {
		prev[curr.slug] = { type: curr.es_data_type === 'null' ? 'keyword' : curr.es_data_type }
		return prev
	}, {} as { [key: string]: { type: any }}) // TODO replace any with EsDataType
	properties.text = { type: 'text' }

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
		})	
	} catch (err) {
		console.log('createIndex', err)
	}
}

export default async function indexDocument(slug: string, entry: Entry) {
	try {
		await client.index({
			id: entry.metadata.id,
			index: slug,
			type: 'doc',
			body: { ...entry.metadata, ...entry.textdata, text: entry.text }
		})
	} catch (err) {
		console.log('indexDocument', err)
	}
}
