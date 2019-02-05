"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
async function updateMetadata(projectId, metadataKeys) {
    const rows = await utils_1.selectByProp('metadata', 'project_id', projectId);
    for (const [index, key] of metadataKeys.sort().entries()) {
        const found = rows.find(row => row.slug === key);
        if (found)
            continue;
        const sql = `INSERT INTO metadata
						(project_id, slug, title, sortorder, created)
					VALUES
						($1, $2, $3, $4, NOW())`;
        await utils_1.execSql(sql, [projectId, key, key, index + 1]);
    }
    for (const row of rows.filter(r => metadataKeys.indexOf(r.slug) === -1)) {
        const sql = `DELETE FROM metadata WHERE id = $1`;
        await utils_1.execSql(sql, [row.id]);
    }
}
exports.default = updateMetadata;
