import * as es from 'elasticsearch'

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

export async function createIndex(slug: string, metadataKeys: string[]) {
	const properties = metadataKeys.reduce((prev, curr) => {
		const type = curr === 'text' ? 'text' : 'keyword'
		prev[curr] = { type }
		return prev
	}, {})

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

export default async function indexDocument(data: any) {
	try {
		await client.index({
			id: data.id,
			index: 'gekaaptebrieven',
			type: 'doc',
			body: data
		})
	} catch (err) {
		console.log('indexDocument', err)
	}
}
