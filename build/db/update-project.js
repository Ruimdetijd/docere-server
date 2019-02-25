"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const es_1 = require("../es");
async function updateProject(slug, props) {
    const setters = Object.keys(props).map((prop, index) => `${prop} = $${index + 2}`).concat('updated = NOW()');
    const sql = `UPDATE project
				SET ${setters.join(',')}
				WHERE slug = $1
				RETURNING *`;
    if (props.hasOwnProperty('metadata_extractor') && props.metadata_extractor != null ||
        props.hasOwnProperty('extractors') && props.extractors != null) {
        const prevProject = await utils_1.selectOne('project', 'slug', slug);
        if (prevProject.metadata_extractor !== props.metadata_extractor ||
            prevProject.extractors !== props.extractors) {
            es_1.default(slug, props.metadata_extractor, props.extractors);
        }
    }
    const result = await utils_1.execSql(sql, [slug].concat(Object.keys(props).map(prop => {
        if (prop === 'extractors')
            return JSON.stringify(props[prop]);
        return props[prop];
    })));
    const project = result.rows[0];
    return project;
}
exports.default = updateProject;
