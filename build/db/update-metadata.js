"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
async function updateMetadata(metadataId, props) {
    const sql = `UPDATE metadata
				SET title = $1, es_data_type = $2, aside = $3, updated = NOW()
				WHERE id = $4
				RETURNING *`;
    const result = await utils_1.execSql(sql, [props.title, props.es_data_type, props.aside, metadataId]);
    return result.rows[0];
}
exports.default = updateMetadata;
