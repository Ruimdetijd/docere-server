import { execSql, selectByProp } from './utils'

export default async function updateMetadata(projectId: string, metadataKeys: string[]): Promise<void> {
	const rows = await selectByProp('metadata', 'project_id', projectId)
	for (const [index, key] of metadataKeys.sort().entries()) {
		// If the metadata is already in the DB skip the insert into
		const found = rows.find(row => row.slug === key)
		if (found) continue;

		const sql = `INSERT INTO metadata
						(project_id, slug, title, sortorder, created)
					VALUES
						($1, $2, $3, $4, NOW())`
		await execSql(sql, [projectId, key, key, index + 1])
	}

	// Remove the metadata from the DB that is not present in the metadata keys
	for (const row of rows.filter(r => metadataKeys.indexOf(r.slug) === -1)) {
		const sql = `DELETE FROM metadata WHERE id = $1`	
		await execSql(sql, [row.id])
	}
}
