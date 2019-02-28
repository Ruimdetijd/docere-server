// TODO fix. Extractor is copied from docere
interface ExtractedItem {
	count: number
	node: any
	id: string
}
export interface Extractor {
	color: string
	id: string
	items?: ExtractedItem[]
	idAttribute?: string
	selector: string
	title: string
}

export class Project {
	description: string
	extractors: Extractor[]
	facsimile_extractor: string
	files: string[]
	id: string
	metadata_extractor: string
	slug: string
	splitter: string
	title: string
	userIds: string[]
	xmlIds: string[]
}

export class User {
	admin: boolean
	authenticated: boolean
	email: string
	id: string
	password: string
	projects: string[]
}

export class Entry {
	id: string
	xml_id: number
	xml: string
	created: string
	updated: string
}