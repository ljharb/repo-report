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
			choices: ['name', 'updated', 'created'],
			default: 'updated',
			describe: 'Sort repositories by field such as name, updated date, or created date.',
			type: 'string',
		})
		.option('desc', {
			default: false,
			describe: 'Sort descending, instead of ascending)',
			type: 'boolean',
		});
};
