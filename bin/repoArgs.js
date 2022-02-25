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
			default: false,
			describe: 'Sort repos alphabetically, instead of by "last updated"',
			type: 'boolean',
		});
};
