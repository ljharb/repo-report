'use strict';

const { spawnSync } = require('child_process');

const runCli = (command) => spawnSync('node', ['../repo-report/bin/run', ...command], { encoding: 'utf-8' });

const cliWrapper = () => ({
	run: runCli,
});

const stdout = () => {
	const previousWrite = process.stdout.write;
	const loggedData = [];

	process.stdout.write = function (string) {
		loggedData.push(string);
	};

	return {
		loggedData,
		restore() {
			process.stdout.write = previousWrite;
		},
	};

};

module.exports = {
	cliWrapper,
	stdout,
};
