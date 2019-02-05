import { execSql, selectOne } from './utils'
import { Project } from '../models'
import updateIndex from '../es'
import updateMetadata from './update-metadata'

async function updateProject(slug: string, props: Partial<Project>): Promise<Project> {
	const setters = Object.keys(props).map((prop, index) => `${prop} = $${index + 2}`).concat('updated = NOW()')
	const sql = `UPDATE project
				SET ${setters.join(',')}
				WHERE slug = $1
				RETURNING *`

	if (props.hasOwnProperty('metadata_extractor') && props.metadata_extractor != null) {
		// Get the previous project from the DB 
		const prevProject = await selectOne('project', 'slug', slug) as Project

		// Only update the index if the extractor has changed
		if (prevProject.metadata_extractor !== props.metadata_extractor) {
			// Update index is async, but we don't have to wait for it
			updateIndex(slug, props.metadata_extractor).then(metadataKeys => {
				updateMetadata(prevProject.id, metadataKeys)
			})
		}
	}

	const result = await execSql(
		sql,
		[slug].concat(Object.keys(props).map(prop => props[prop]))
	)

	const project = result.rows[0] as Project

	return project
}

export default updateProject