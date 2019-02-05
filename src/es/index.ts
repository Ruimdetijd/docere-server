import * as fs from 'fs'
import * as puppeteer from 'puppeteer'
import indexDocument, { deleteIndex, createIndex } from './index-document'

function logWarning(warning: string) {
	console.log(`[WARNING] ${warning}`)
}

async function extractMetadata(files: string[], metadata_extractor: string, baseDir: string) {
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
	await page.addScriptTag({
		path: './node_modules/xmlio/dist/bundle.js'
	})

	const output: any = await page.evaluate(
		async function(xmlFiles: string[], metadata_extractor: string, slug: string) {
			function fetchXml(url: string): Promise<any> {
				return new Promise((resolve, reject) => {
					var xhr = new XMLHttpRequest
					xhr.open('GET', url)
					xhr.responseType = 'document'
					xhr.overrideMimeType('text/xml')

					xhr.onload = function() {
						if (xhr.readyState === xhr.DONE && xhr.status === 200) {
							resolve(xhr.responseXML.documentElement)
						}
					}

					xhr.onerror = function() { reject('this does not work 1') }
					xhr.onabort = function() { reject('this does not work 2') }
					xhr.ontimeout = function() { reject('this does not work 3') }

					xhr.send()
				})
			}

			const esData = []
			for (const file of xmlFiles) {
				const xmlRoot = await fetchXml(`/api/xml/${slug}/${file}`)
				// @ts-ignore
				const xmlio = await new XMLio(xmlRoot)

				const extractMetadata = new Function(`return ${metadata_extractor}`)
				const meta = extractMetadata()(xmlio)

				const entryData =  meta.reduce((prev: any, curr: any) => {
					prev[curr[0]] = curr[1]
					return prev
				}, {})

				entryData.text = xmlio.export({ type: 'text' })

				esData.push(entryData)
			}
			return esData
		},
		files,
		metadata_extractor,
		baseDir
	)

	browser.close()

	return output
}

export default async function main(slug: string, metadata_extractor: string) {
	const files = fs.readdirSync(`./public/xml/${slug}`)
	let metadataKeys = new Set()
	let esData: any
	try {
		esData = await extractMetadata(files, metadata_extractor, slug)
	} catch (err) {
		console.log("ANOTHER ERRR", err)	
	}

	for (const data of esData) {
		metadataKeys = new Set([...metadataKeys, ...new Set(Object.keys(data))])
	}

	await deleteIndex(slug)
	await createIndex(slug, [...metadataKeys])

	for (const data of esData) {
		console.log(`Indexing ${data.id}`)
		await indexDocument(data)
	}

	// Return the metadata keys, but filter out the text prop
	return [...metadataKeys].filter(k => k !== 'text')
}