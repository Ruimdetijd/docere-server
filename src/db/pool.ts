// import { readFileSync, existsSync } from 'fs'

import * as pg from "pg"
pg.types.setTypeParser(20, function (value) {
    return parseInt(value);
});
pg.types.setTypeParser(1184, function (value) {
	// console.log('sp', value)
	return value
	// if (value.slice(-2) === 'BC') {
	// 	const firstDashIndex = value.indexOf('-')
	// 	let year = value.slice(0, firstDashIndex)
	// 	year = year.padStart(6, '0')
	// 	value = `-${year}${value.slice(firstDashIndex, -2)}`
	// }
	// return new Date(value).getTime()
});

// function getSecret(name: string): string {
// 	const path = `/run/secrets/${name}`
// 	if (existsSync(path)) {
// 		return readFileSync(path, 'utf8').trim()
// 	}
// }
console.log('PGPASS', process.env.PGPASS)

export default () => new pg.Pool({
	database: 'docere',
	host: process.env.PGHOST || 'localhost',
	password: process.env.PGPASS || 'postgis',
	user: 'postgres'
})
