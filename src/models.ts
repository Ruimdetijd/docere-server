export class Project {
	description: string
	files: string[]
	id: string
	slug: string
	title: string
	userIds: string[]
	metadata_extractor: string
	facsimile_extractor: string
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