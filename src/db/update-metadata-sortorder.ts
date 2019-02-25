import { execSql } from './utils'

export default async function updateMetadataSortorder(body: [string, number][]): Promise<any> {
	for (const [id, sortorder] of body) {
		const sql = `UPDATE metadata
					SET sortorder = $2, updated = NOW()
					WHERE id = $1`

		await execSql(
			sql,
			[id, sortorder]
		)

	}
}
