import chalk from "chalk"

export const logError = (title: string, lines: Array<string>) =>
	console.error(chalk`{red [ERROR][${title}]}\n{gray ${lines.join('\n')}}\n{red [/ERROR]}`)
