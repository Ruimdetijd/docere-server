"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg = require("pg");
pg.types.setTypeParser(20, function (value) {
    return parseInt(value);
});
pg.types.setTypeParser(1184, function (value) {
    return value;
});
console.log('PGPASS', process.env.PGPASS);
exports.default = () => new pg.Pool({
    database: 'docere',
    host: process.env.PGHOST || 'localhost',
    password: process.env.PGPASS || 'postgis',
    user: 'postgres'
});
