'use strict';

module.exports = function formatArgs(yargs) {
	return yargs
		.option('json', {
			default: false,
			describe: 'Output report in json format',
			type: 'boolean',
		});
};
