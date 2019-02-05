"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const utils_1 = require("./utils");
exports.default = async (user) => {
    const sql = `INSERT INTO docere_user
					(email, password, created, updated)
				VALUES
					($1, crypt($2, gen_salt('bf')), NOW(), NULL)
				ON CONFLICT (email)
				DO UPDATE SET
					password = crypt($2, gen_salt('bf')),
					updated = NOW()
				RETURNING *`;
    const result = await utils_1.execSql(sql, [
        user.email,
        user.password
    ]);
    let fullUser;
    if (utils_1.hasRows(result)) {
        fullUser = result.rows[0];
        console.log(chalk_1.default `\n{green [DB] Inserted project:}
{gray email}\t\t\t\t${fullUser.email}
{gray password}\t\t\t${fullUser.password}
{gray ID}\t\t${fullUser.id}\n\n`);
    }
    return fullUser;
};
