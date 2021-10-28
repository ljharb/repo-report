'use strict';

const path = require('path');
const homedir = require('os').homedir();

module.exports = function cacheArgs(yargs) {
	const { XDG_CACHE_DIR } = process.env;
	const cachePath = XDG_CACHE_DIR ? path.join(XDG_CACHE_DIR, '.repo-report') : path.join(homedir, '.repo-report', 'cache');

	return yargs
		.option('cache', {
			default: false,
			describe: 'Dump API requests and cleaned up data in `--cacheDir` path',
			type: 'boolean',
		})
		.option('cacheDir', {
			default: cachePath,
			normalize: true,
		})
		.hide('cacheDir');
};
