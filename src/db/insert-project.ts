import * as fs from 'fs'
import chalk from 'chalk'
import { execSql, hasRows } from './utils'
import { Project } from '../models'

export default async (project: Partial<Project>): Promise<Project> => {
	// Extend project with defaults
	project = {
		description: '',
		files: [],
		...project
	}

	project.files = fs.readdirSync(`public/xml/${project.slug}`)
		.filter(file => (/\.xml$/usg).test(file))
		.map(file => file.slice(0, -4))

	const sql = `INSERT INTO project
					(slug, title, description, files, created)
				VALUES
					($1, $2, $3, $4, NOW())
				ON CONFLICT (slug)
				DO UPDATE SET
					title = $2,
					description = $3,
					files = $4,
					updated = NOW()
				RETURNING *`

	const result = await execSql(sql, [
		project.slug,
		project.title,
		project.description,
		`{${project.files.join(',')}}`
	])

	let fullProject: Project
	if (hasRows(result)) {
		fullProject = result.rows[0]

		console.log(chalk`\n{green [DB] Inserted project:}
{gray label}\t\t\t\t${fullProject.slug}
{gray title}\t\t\t\t${fullProject.title}
{gray description}\t\t\t${fullProject.description}
{gray ID}\t\t${fullProject.id}\n\n`
		)
	}

	return fullProject
}