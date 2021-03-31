'use strict';

const { spawnSync } = require('child_process');

const runCli = (command) => spawnSync('node', ['../repo-report/bin/run', ...command], { encoding: 'utf-8' });

const createCLIWrapper = () => ({
	run: runCli,
});

module.exports = createCLIWrapper;

