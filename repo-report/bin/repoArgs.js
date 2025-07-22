'use strict';

module.exports = function repoArgs(yargs) {
	return yargs
		.option('focus', {
			alias: 'f',
			choices: [
				'sources',
				'forks',
				'templates',
				'private',
				'public',
			],
			describe: 'Focus repo types',
		})
		.option('names', {
			default: false,
			describe: 'Shows the list of repo names with their owner',
			type: 'boolean',
		})

		.option('sortBy', {
			alias: 's',
			choices: ['name', 'updatedDate', 'createdDate'],
			default: 'updatedDate',
			describe: 'Sort repositories by field',
			type: 'string',
		})

		.option('reverse', {
			alias: 'r',
			default: false,
			describe: 'Sort in reverse',
			type: 'boolean',
		});
};
