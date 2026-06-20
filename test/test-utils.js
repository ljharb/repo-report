'use strict';

const { spawnSync } = require('child_process');
const mockProperty = require('mock-property');

/** @import { SpawnSyncReturns } from 'child_process' */

/** @type {(command: string[]) => SpawnSyncReturns<string>} */
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
	/** @type {(string | Uint8Array)[]} */
	const loggedData = [];

	return {
		loggedData,
		restore: mockProperty(process.stdout, 'write', {
			value: /** @type {typeof process.stdout.write} */ (function write(string) {
				loggedData[loggedData.length] = string;
			}),
		}),
	};
}

function stderr() {
	/** @type {(string | Uint8Array)[]} */
	const loggedData = [];

	return {
		loggedData,
		restore: mockProperty(process.stderr, 'write', {
			value: /** @type {typeof process.stderr.write} */ (function write(string) {
				loggedData[loggedData.length] = string;
			}),
		}),
	};
}

module.exports = {
	cliWrapper,
	stdout,
	stderr,
};
