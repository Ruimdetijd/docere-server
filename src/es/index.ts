import * as fs from 'fs'
import * as puppeteer from 'puppeteer'
import indexDocument, { deleteIndex, createIndex } from './index-document'
import { Extractor } from '../models'
import syncMetadata from '../db/sync-metadata';

export type DocData = [{ [key: string]: string }, { [key: string]: string[] }, string]

function logWarning(warning: string) {
	console.log(`[WARNING] ${warning}`)
}

async function extractData(files: string[], metadata_extractor: string, extractors: Extractor[], slug: string) {
	const browser = await puppeteer.launch({
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
		]
	})

	const page = await browser.newPage()
	page.on('console', (msg: any) => {
		msg = msg.text()
		if (msg.slice(0, 7) === 'WARNING') logWarning(msg.slice(7))
		else console.log('From page: ', msg)
	})
	await page.goto('http://localhost:4000')
	await page.addScriptTag({ path: './node_modules/xmlio/dist/bundle.js' })

	const output: DocData[] = await page.evaluate(
		async function(xmlFiles: string[], metadata_extractor: string, extractorsJson: string, slug: string) {
			function fetchXml(url: string): Promise<any> {
				return new Promise((resolve, reject) => {
					var xhr = new XMLHttpRequest
					xhr.open('GET', url)
					xhr.responseType = 'document'
					xhr.overrideMimeType('text/xml')

					xhr.onload = function() {
						if (xhr.readyState === xhr.DONE && xhr.status === 200) {
							if (xhr.responseXML == null) {
								reject(`Fetching XML of "${url}" failed`)
								return
							}
							resolve(xhr.responseXML)
						}
					}

					xhr.send()
				})
			}

			const esData: DocData[] = []
			for (const file of xmlFiles) {
				try {
					const xmlRoot = await fetchXml(`/api/xml/${slug}/${file}`)
					// @ts-ignore, XMLio is not defined in this document, but it is on Puppeteer's page
					const xmlio = await new XMLio(xmlRoot)

					const entryData: DocData = [{}, {}, '']

					if (metadata_extractor != null) {
						const extractMetadata = new Function(`return ${metadata_extractor}`)
						const meta = extractMetadata()(xmlio)
						// Reduce metadata to map
						entryData[0] =  meta
							.reduce((prev: any, curr: any) => {
								let [key, value] = curr
								if (key !== 'id') key = `m_${key}`
								if (prev.hasOwnProperty(key)) {
									if (!Array.isArray(prev[key])) prev[key] = [prev[key]]
									prev[key].push(value)
								}
								else prev[key] = value
								return prev
							}, {})
					}
					entryData[0].m__filebasename = file.slice(0, -4)
					if (!entryData[0].hasOwnProperty('id')) entryData[0].id = file.slice(0, -4)

					const extractors: Extractor[] = JSON.parse(extractorsJson)
					if (extractors != null) {
						for (const extractor of extractors) {
							let nodes = xmlio
								.select(extractor.selector)
								// Only export deep if there is not an idAttribute. With an idAttribute,
								// data is loaded from an external data source. Without the idAttribute,
								// the node's content is shown
								.export({ type: 'data', deep: extractor.idAttribute == null })
							if (nodes == null) continue
							if (!Array.isArray(nodes)) nodes = [nodes]
							
							const ids: string[] = nodes.map((node: any) =>
								extractor.idAttribute == null ?
									node.children.map((c: any) => typeof c === 'string' ? c : '').join('') :
									node.attributes[extractor.idAttribute]
							)

							entryData[1][`t_${extractor.id}`] = [...new Set(ids)]
						}
					}

					// Add plain text (without tags)
					entryData[2] = xmlio.export({ type: 'text' })
					esData.push(entryData)
				} catch (err) {
					console.log(err)	
				}
			}
			return esData
		},
		files,
		metadata_extractor,
		JSON.stringify(extractors),
		slug
	)

	browser.close()

	return output
}

export default async function main(slug: string, metadata_extractor: string, extractors: Extractor[]) {
	const files = fs.readdirSync(`./public/xml/${slug}`)
	let documentsData: DocData[]
	try {
		documentsData = await extractData(files, metadata_extractor, extractors, slug)
	} catch (err) {
		console.log("ANOTHER ERRR", err)	
	}

	let metadataKeys = new Set()
	for (const [metadata, textData] of documentsData) {
		metadataKeys = new Set([
			...metadataKeys,
			...new Set(Object.keys(metadata)),
			...new Set(Object.keys(textData))
		])
	}

	const metadata = await syncMetadata(slug, [...metadataKeys])

	await deleteIndex(slug)
	await createIndex(slug, metadata)

	for (const docData of documentsData) {
		console.log(`Indexing ${docData[0].id}`)
		await indexDocument(slug, docData)
	}
}
