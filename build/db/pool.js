"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const pg = require("pg");
pg.types.setTypeParser(20, function (value) {
    return parseInt(value);
});
pg.types.setTypeParser(1184, function (value) {
    return value;
});
function getSecret(name) {
    const path = `/run/secrets/${name}`;
    if (fs_1.existsSync(path)) {
        return fs_1.readFileSync(path, 'utf8').trim();
    }
}
exports.default = () => new pg.Pool({
    database: getSecret('civslog_db_name') || 'docere',
    host: process.env.PGHOST,
    password: getSecret('civslog_db_password') || 'postgis',
    user: getSecret('civslog_db_user') || 'postgres'
});
