"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = require("./pool");
const utils_1 = require("../utils");
async function isAdmin(email, password, shouldBeAdmin = false) {
    const sql = `SELECT *
				FROM docere_user
				WHERE email = $1
					AND password = crypt($2, password)`;
    const result = await exports.execSql(sql, [email, password]);
    return result.rows[0];
}
exports.isAdmin = isAdmin;
function hasRows(result) {
    return (result != null && result.hasOwnProperty('rows') && result.rows.length);
}
exports.hasRows = hasRows;
exports.selectByProp = async (table, field, value, fields) => {
    const selectFields = fields == null ? '*' : fields.join(',');
    const sql = `SELECT ${selectFields} 
				FROM ${table}
				WHERE ${field}=$1`;
    const result = await exports.execSql(sql, [value]);
    return result.rows;
};
exports.selectOne = async (table, field, value, fields) => {
    const rows = await exports.selectByProp(table, field, value, fields);
    return rows[0];
};
exports.execSql = async (sql, values = []) => {
    let result;
    const pool = pool_1.default();
    try {
        result = await pool.query(sql, values);
    }
    catch (err) {
        utils_1.logError('execSql', ['SQL execution failed', sql, values.map((v, i) => `${i}: ${v}\n`).join(''), err]);
    }
    await pool.end();
    return result;
};
