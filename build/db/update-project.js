"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const es_1 = require("../es");
function has(props, key) {
    return props.hasOwnProperty(key) && props[key] != null;
}
async function updateProject(slug, props) {
    const setters = Object.keys(props).map((prop, index) => `${prop} = $${index + 2}`).concat('updated = NOW()');
    const sql = `UPDATE project
				SET ${setters.join(',')}
				WHERE slug = $1
				RETURNING *`;
    const hasMetadataExtractor = has(props, 'metadata_extractor');
    const hasExtractors = has(props, 'extractors');
    const hasSplitter = has(props, 'splitter');
    const hasFacsimileExtractor = has(props, 'facsimile_extractor');
    if (hasMetadataExtractor || hasExtractors || hasSplitter || hasFacsimileExtractor) {
        const prevProject = await utils_1.selectOne('project', 'slug', slug);
        if ((hasMetadataExtractor && prevProject.metadata_extractor !== props.metadata_extractor) ||
            (hasExtractors && JSON.stringify(prevProject.extractors) !== JSON.stringify(props.extractors)) ||
            (hasSplitter && prevProject.splitter !== props.splitter) ||
            (hasFacsimileExtractor && prevProject.facsimile_extractor !== props.facsimile_extractor)) {
            es_1.default(slug, props.splitter, props.metadata_extractor, props.facsimile_extractor, props.extractors);
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
