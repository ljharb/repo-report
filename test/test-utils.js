'use strict';

const { spawnSync } = require('child_process');
const mockProperty = require('mock-property');

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
	const loggedData = [];

	return {
		loggedData,
		restore: mockProperty(process.stdout, 'write', {
			value: function write(string) {
				loggedData[loggedData.length] = string;
			},
		}),
	};
}

function stderr() {
	const loggedData = [];

	return {
		loggedData,
		restore: mockProperty(process.stderr, 'write', {
			value: function write(string) {
				loggedData[loggedData.length] = string;
			},
		}),
	};
}

module.exports = {
	cliWrapper,
	stdout,
	stderr,
};
