"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const chalk_1 = require("chalk");
const utils_1 = require("./utils");
exports.default = async (project) => {
    project = Object.assign({ description: '', files: [] }, project);
    project.files = fs.readdirSync(`public/xml-source/${project.slug}`)
        .filter(file => (/\.xml$/usg).test(file))
        .map(file => file.slice(0, -4));
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
				RETURNING *`;
    const result = await utils_1.execSql(sql, [
        project.slug,
        project.title,
        project.description,
        `{${project.files.join(',')}}`
    ]);
    let fullProject;
    if (utils_1.hasRows(result)) {
        fullProject = result.rows[0];
        console.log(chalk_1.default `\n{green [DB] Inserted project:}
{gray label}\t\t\t\t${fullProject.slug}
{gray title}\t\t\t\t${fullProject.title}
{gray description}\t\t\t${fullProject.description}
{gray ID}\t\t${fullProject.id}\n\n`);
    }
    return fullProject;
};
