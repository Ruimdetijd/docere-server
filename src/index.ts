import * as fs from 'fs'
import * as express from 'express'
import insertProject from './db/insert-project'
import updateProject from './db/update-project'
import insertUser from './db/insert-user'
import { execSql, selectOne, selectByProp } from './db/utils'
import { Project } from './models'

const app = express()
app.disable('x-powered-by')
app.use(express.json())
app.use(express.static('public'))

app.get('/projects', async (req, res) => {
	const sql = `SELECT * FROM project`
	const result = await execSql(sql)
	const projects: Project[] = result.rows
	res.json(projects)
})

app.post('/projects', async (req, res) => {
	const project = await insertProject(req.body)
	res.json(project)
})

app.get('/projects/:slug', async (req, res) => {
	const project = await selectOne('project', 'slug', req.params.slug)
	project.metadata_fields = await selectByProp('metadata', 'project_id', project.id, ['slug', 'title', 'sortorder'])
	res.json(project)
})

app.put('/projects/:slug', async (req, res) => {
	const project = await updateProject(req.params.slug, req.body)
	res.json(project)
})

app.post('/users', async (req, res) => {
	const user = await insertUser(req.body)
	res.json(user)
})

async function init() {
	const sql = `SELECT count(*) FROM project`
	const result = await execSql(sql)
	if (result.rows[0].count === 0) {

		const slugs = fs.readdirSync(`public/xml`) as string[]
		for (const slug of slugs) {
			await insertProject({ slug })
		}
	}
}

init()

const PORT = 3377
app.listen(PORT)
console.log(`Docere server on port ${PORT}`)