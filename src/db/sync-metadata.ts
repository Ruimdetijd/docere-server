import { execSql, selectByProp, selectOne } from './utils'
import { Project } from '../models';

export default async function syncMetadata(projectSlug: string, metadataKeys: string[]): Promise<any[]> {
	const project = await selectOne('project', 'slug', projectSlug) as Project
	const rows = await selectByProp('metadata', 'project_id', project.id)

	for (const [index, key] of metadataKeys.sort().entries()) {
		// If the metadata is already in the DB skip the insert into
		const found = rows.find((row: any) => row.slug === key)
		if (found) continue;

		const sql = `INSERT INTO metadata
						(project_id, slug, title, sortorder, created)
					VALUES
						($1, $2, $3, $4, NOW())`
		await execSql(sql, [project.id, key, key.slice(2), index + 1])
	}

	// Remove the metadata from the DB that is not present in the metadata keys
	for (const row of rows.filter((r: any) => metadataKeys.indexOf(r.slug) === -1)) {
		const sql = `DELETE FROM metadata WHERE id = $1`	
		await execSql(sql, [row.id])
	}

	return await selectByProp('metadata', 'project_id', project.id)
}
