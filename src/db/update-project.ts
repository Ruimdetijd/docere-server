import { execSql, selectOne } from './utils'
import { Project } from '../models'
import updateIndex from '../es'
// import syncMetadata from './sync-metadata'

function has(props: Partial<Project>, key: keyof Project) {
	return props.hasOwnProperty(key) && props[key] != null
}

async function updateProject(slug: string, props: Partial<Project>): Promise<Project> {
	const setters = Object.keys(props).map((prop, index) => `${prop} = $${index + 2}`).concat('updated = NOW()')
	const sql = `UPDATE project
				SET ${setters.join(',')}
				WHERE slug = $1
				RETURNING *`

	const hasMetadataExtractor = has(props, 'metadata_extractor')
	const hasExtractors = has(props, 'extractors')
	const hasSplitter = has(props, 'splitter')
	const hasFacsimileExtractor = has(props, 'facsimile_extractor')

	if (hasMetadataExtractor || hasExtractors || hasSplitter || hasFacsimileExtractor) {
		// Get the previous project from the DB 
		const prevProject = await selectOne('project', 'slug', slug) as Project

		// Only update the index if metadata_extractor or extractors has changed
		if (
			(hasMetadataExtractor && prevProject.metadata_extractor !== props.metadata_extractor) ||
			(hasExtractors && JSON.stringify(prevProject.extractors) !== JSON.stringify(props.extractors)) ||
			(hasSplitter && prevProject.splitter !== props.splitter) ||
			(hasFacsimileExtractor && prevProject.facsimile_extractor !== props.facsimile_extractor)
		) {
			// Update index is async, but we don't have to wait for it
			updateIndex(slug, props.splitter, props.metadata_extractor, props.facsimile_extractor, props.extractors)
		}
	}

	const result = await execSql(
		sql,
		[slug].concat(Object.keys(props).map(prop => {
			if (prop === 'extractors') return JSON.stringify(props[prop])
			return (props as any)[prop]
		}))
	)

	const project = result.rows[0] as Project

	return project
}

export default updateProject
