import { execSql, selectOne } from './utils'
import { Project } from '../models'
import updateIndex from '../es'
// import syncMetadata from './sync-metadata'

async function updateProject(slug: string, props: Partial<Project>): Promise<Project> {
	const setters = Object.keys(props).map((prop, index) => `${prop} = $${index + 2}`).concat('updated = NOW()')
	const sql = `UPDATE project
				SET ${setters.join(',')}
				WHERE slug = $1
				RETURNING *`

	// Only update the index if the updated props contain metadata_extractor or extractors
	if (
		props.hasOwnProperty('metadata_extractor') && props.metadata_extractor != null ||
		props.hasOwnProperty('extractors') && props.extractors != null
	) {
		// Get the previous project from the DB 
		const prevProject = await selectOne('project', 'slug', slug) as Project

		// Only update the index if metadata_extractor or extractors has changed
		if (
			prevProject.metadata_extractor !== props.metadata_extractor ||
			prevProject.extractors !== props.extractors
		) {
			// Update index is async, but we don't have to wait for it
			updateIndex(slug, props.metadata_extractor, props.extractors)
			// .then(metadataKeys => {
			// 	syncMetadata(prevProject.id, metadataKeys)
			// })
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
