import createPool from './pool'
import { logError } from '../utils'
import { QueryResult } from 'pg'

export async function isAdmin(email: string, password: string, shouldBeAdmin: boolean = false) {
	const sql = `SELECT *
				FROM docere_user
				WHERE email = $1
					AND password = crypt($2, password)`
	const result = await execSql(sql, [email, password])
	return result.rows[0]
}

export function hasRows(result: QueryResult) {
	return (result != null && result.hasOwnProperty('rows') && result.rows.length)
}

export const selectByProp = async (table: string, field: string, value: string, fields?: string[]): Promise<any> => {
	const selectFields = fields == null ? '*' : fields.join(',')
	const sql = `SELECT ${selectFields} 
				FROM ${table}
				WHERE ${field}=$1`
	const result = await execSql(sql, [value])
	return result.rows
}


export const selectOne = async (table: string, field: string, value: string, fields?: string[]): Promise<any> => {
	const rows = await selectByProp(table, field, value, fields)
	return rows[0]
}

export const execSql = async (sql: string, values: (string | number)[] = []) : Promise<QueryResult> => {
	let result

	const pool = createPool()

	try {
		result = await pool.query(sql, values)
	} catch (err) {
		logError('execSql', ['SQL execution failed', sql, values.map((v, i) => `${i}: ${v}\n`).join(''), err])		
	}

	await pool.end()

	return result
}