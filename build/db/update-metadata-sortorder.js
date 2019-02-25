"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
async function updateMetadataSortorder(body) {
    for (const [id, sortorder] of body) {
        const sql = `UPDATE metadata
					SET sortorder = $2, updated = NOW()
					WHERE id = $1`;
        await utils_1.execSql(sql, [id, sortorder]);
    }
}
exports.default = updateMetadataSortorder;
