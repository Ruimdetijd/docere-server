import * as path from 'path'
import * as fs from 'fs-extra'
import * as puppeteer from 'puppeteer'
import indexDocument, { deleteIndex, createIndex } from './index-document'
import { Extractor } from '../models'
import syncMetadata from '../db/sync-metadata'

export type Entry = {
	fileName: string
	metadata: { [key: string]: string }
	textdata: { [key: string]: string[] }
	text: string
	xml: string
	xmlDoc: XMLDocument
}

function logWarning(warning: string) {
	console.log(`[WARNING] ${warning}`)
}

async function extractData(
	files: string[],
	splitter: string,
	metadata_extractor: string,
	facsimile_extractor: string,
	extractors: Extractor[],
	slug: string
) {
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

	const output: Entry[] = await page.evaluate(
		async function(xmlFiles: string[], splitter: string, metadata_extractor: string, facsimile_extractor: string, extractorsJson: string, slug: string) {
			let entries: Entry[] = []
			const serializer = new XMLSerializer()

			function fetchXml(url: string): Promise<XMLDocument> {
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

			// let xmlDocByFileName = new Map<string, XMLDocument>()
			for (const fileName of xmlFiles) {
				const entryData: Entry = { fileName: null, metadata: {}, textdata: {}, text: null, xml: null, xmlDoc: null }
				const xmlDoc = await fetchXml(`/api/xml-source/${slug}/${fileName}.xml`)
				entryData.fileName = fileName
				entryData.xmlDoc = xmlDoc
				entries.push(entryData)
			}

			if (splitter != null) {
				const tmpData: Entry[] = []
				for (const entryData of entries) {
					// @ts-ignore
					const xmlio = await new XMLio(entryData.xmlDoc)	
					const splitXML = new Function(`return ${splitter}`)
					const xmlDocs = splitXML()(xmlio)

					for (const [index, xmlDoc] of xmlDocs.entries()) {
						const nextEntry: Entry = { fileName: null, metadata: {}, textdata: {}, text: null, xml: null, xmlDoc: null }
						nextEntry.xmlDoc = xmlDoc
						nextEntry.fileName = `${entryData.fileName}_${index}`
						tmpData.push(nextEntry)
					}

					entries = tmpData
				}
			}

			for (const entry of entries) {
				// @ts-ignore, XMLio is not defined in this document, but it is on Puppeteer's page
				const xmlio = await new XMLio(entry.xmlDoc)


				if (metadata_extractor != null) {
					const extractMetadata = new Function(`return ${metadata_extractor}`)
					const meta = extractMetadata()(xmlio, entry.fileName)
					// Reduce metadata to map
					entry.metadata =  meta
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
				entry.metadata.__filebasename = entry.fileName
				if (!entry.metadata.hasOwnProperty('id')) entry.metadata.id = entry.fileName

				// if (facsimile_extractor != null) {
				// 	const extractFacsimiles = new Function(`return ${facsimile_extractor}`)
				// 	const facsimiles = extractFacsimiles()(xmlio)
				// 	entry.metadata.__facsimiles = facsimiles.facsimiles.map((f: any) => f.path)
				// }

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
						
						const ids: string[] = nodes.map((node: any) => {
							return extractor.idAttribute == null ?
								node.children.map((c: any) => typeof c === 'string' ? c : '').join('') :
								node.attributes[extractor.idAttribute]
						})

						entry.textdata[`t_${extractor.id}`] = [...new Set(ids)]
					}
				}

				// Add plain text (without tags)
				entry.text = xmlio.export({ type: 'text' })
				
				// Add XML as string (will be written to a file)
				entry.xml = serializer.serializeToString(entry.xmlDoc)
			}
			return entries
		},
		files,
		splitter,
		metadata_extractor,
		facsimile_extractor,
		JSON.stringify(extractors),
		slug
	)

	browser.close()

	return output
}

export default async function main(
	slug: string,
	splitter: string,
	metadata_extractor: string,
	facsimile_extractor: string,
	extractors: Extractor[]
) {
	const files = fs.readdirSync(`./public/xml-source/${slug}`)
	let entries: Entry[]
	try {
		entries = await extractData(
			files.map(f => path.basename(f, '.xml')),
			splitter,
			metadata_extractor,
			facsimile_extractor,
			extractors,
			slug
		)
	} catch (err) {
		console.log("ANOTHER ERRR", err)	
	}

	let metadataKeys = new Set()
	for (const entry of entries) {
		metadataKeys = new Set([
			...metadataKeys,
			...new Set(Object.keys(entry.metadata)),
			...new Set(Object.keys(entry.textdata))
		])
	}

	const metadata = await syncMetadata(slug, [...metadataKeys])

	await deleteIndex(slug)
	await createIndex(slug, metadata)

	const outputDir = `./public/xml/${slug}`
	fs.emptyDirSync(outputDir)
	for (const entry of entries) {
		console.log(`Indexing ${entry.fileName}, with ID: ${entry.metadata.id}`)
		await indexDocument(slug, entry)
		fs.writeFileSync(`${outputDir}/${entry.fileName}.xml`, entry.xml, 'utf8')
	}
}
