'use strict';

const { spawnSync } = require('child_process');

function runCli(command) {
	return spawnSync(
		'node',
		['../repo-report/bin/run', ...command],
		{ encoding: 'utf-8' },
	);
}

function cliWrapper() {
	return { run: runCli };
}

function stdout() {
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
}

function stderr() {
	const previousWrite = process.stderr.write;
	const loggedData = [];

	process.stderr.write = function (string) {
		loggedData.push(string);
	};

	return {
		loggedData,
		restore() {
			process.stderr.write = previousWrite;
		},
	};
}

module.exports = {
	cliWrapper,
	stdout,
	stderr,
};
