"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const express = require("express");
const insert_project_1 = require("./db/insert-project");
const update_project_1 = require("./db/update-project");
const update_metadata_1 = require("./db/update-metadata");
const update_metadata_sortorder_1 = require("./db/update-metadata-sortorder");
const insert_user_1 = require("./db/insert-user");
const utils_1 = require("./db/utils");
const es_1 = require("./es");
const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.static('public'));
app.get('/projects', async (req, res) => {
    const sql = `SELECT * FROM project`;
    const result = await utils_1.execSql(sql);
    const projects = result.rows;
    res.json(projects);
});
app.post('/projects', async (req, res) => {
    const project = await insert_project_1.default(req.body);
    res.json(project);
});
app.get('/projects/:slug', async (req, res) => {
    const project = await utils_1.selectOne('project', 'slug', req.params.slug);
    project.metadata_fields = await utils_1.selectByProp('metadata', 'project_id', project.id, ['id', 'slug', 'title', 'sortorder', 'aside', 'es_data_type', 'type']);
    res.json(project);
});
app.put('/projects/:slug', async (req, res) => {
    const project = await update_project_1.default(req.params.slug, req.body);
    res.json(project);
});
app.put('/metadata/sortorder', async (req, res) => {
    await update_metadata_sortorder_1.default(req.body);
    res.end();
});
app.put('/metadata/:id', async (req, res) => {
    const metadata = await update_metadata_1.default(req.params.id, req.body);
    const nextProject = await utils_1.selectOne('project', 'id', metadata.project_id);
    res.json(nextProject);
});
app.post('/users', async (req, res) => {
    const user = await insert_user_1.default(req.body);
    res.json(user);
});
async function init() {
    const sql = `SELECT slug FROM project`;
    const result = await utils_1.execSql(sql);
    const slugs = fs.readdirSync(`public/xml-source`);
    const projectSlugs = result.rows.map(r => r.slug);
    for (const slug of slugs) {
        if (projectSlugs.indexOf(slug) === -1) {
            await insert_project_1.default({ slug });
            await es_1.default(slug);
        }
    }
}
init();
const PORT = 3377;
app.listen(PORT);
console.log(`Docere server on port ${PORT}`);
