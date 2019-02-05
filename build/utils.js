"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
exports.logError = (title, lines) => console.error(chalk_1.default `{red [ERROR][${title}]}\n{gray ${lines.join('\n')}}\n{red [/ERROR]}`);
