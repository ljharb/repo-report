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
		.option('sort', {
			alias: 's',
			choices: ['name', 'updatedDate', 'createdDate', ''],
			describe: 'Sort repositories by field such as name or updatedDate or createdDate.',
			type: 'string',
		})
		.option('reverse', {
			alias: 'r',
			default: false,
			describe: 'Sort in reverse',
			type: 'boolean',
		});
};
