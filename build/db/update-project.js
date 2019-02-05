"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const es_1 = require("../es");
const update_metadata_1 = require("./update-metadata");
async function updateProject(slug, props) {
    const setters = Object.keys(props).map((prop, index) => `${prop} = $${index + 2}`).concat('updated = NOW()');
    const sql = `UPDATE project
				SET ${setters.join(',')}
				WHERE slug = $1
				RETURNING *`;
    if (props.hasOwnProperty('metadata_extractor') && props.metadata_extractor != null) {
        const prevProject = await utils_1.selectOne('project', 'slug', slug);
        if (prevProject.metadata_extractor !== props.metadata_extractor) {
            es_1.default(slug, props.metadata_extractor).then(metadataKeys => {
                update_metadata_1.default(prevProject.id, metadataKeys);
            });
        }
    }
    const result = await utils_1.execSql(sql, [slug].concat(Object.keys(props).map(prop => props[prop])));
    const project = result.rows[0];
    return project;
}
exports.default = updateProject;
