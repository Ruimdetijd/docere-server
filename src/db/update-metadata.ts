import { execSql } from './utils'
// TODO replace any with MetadataField

async function updateMetadata(metadataId: string, props: any): Promise<any> {
	const sql = `UPDATE metadata
				SET title = $1, es_data_type = $2, aside = $3, updated = NOW()
				WHERE id = $4
				RETURNING *`

	const result = await execSql(
		sql,
		[props.title, props.es_data_type, props.aside, metadataId]
	)

	return result.rows[0]
}

export default updateMetadata
