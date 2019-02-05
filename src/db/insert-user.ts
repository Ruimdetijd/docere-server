import chalk from 'chalk'
import { execSql, hasRows } from './utils'
import { User } from '../models'

export default async (user: Partial<User>): Promise<User> => {
	const sql = `INSERT INTO docere_user
					(email, password, created, updated)
				VALUES
					($1, crypt($2, gen_salt('bf')), NOW(), NULL)
				ON CONFLICT (email)
				DO UPDATE SET
					password = crypt($2, gen_salt('bf')),
					updated = NOW()
				RETURNING *`

	const result = await execSql(sql, [
		user.email,
		user.password
	])

	let fullUser: User
	if (hasRows(result)) {
		fullUser = result.rows[0]

		console.log(chalk`\n{green [DB] Inserted project:}
{gray email}\t\t\t\t${fullUser.email}
{gray password}\t\t\t${fullUser.password}
{gray ID}\t\t${fullUser.id}\n\n`
		)
	}

	return fullUser
}