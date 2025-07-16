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
		})

		.option('sortByName', {
			default: false,
			describe: 'Sort repos by name in ascending order (A → Z)',
			type: 'boolean',
		})
		.option('sortByNameDesc', {
			default: false,
			describe: 'Sort repos by name in descending order (Z → A)',
			type: 'boolean',
		})
		.option('sortByModifiedDate', {
			default: false,
			describe: 'Sort repos by modified date(updatedAt) newest first',
			type: 'boolean',
		})
		.option('sortByModifiedDateDesc', {
			default: false,
			describe: 'Sort repos by modified date(updatedAt) oldest first',
			type: 'boolean',
		})
		.option('sortByCreatedDate', {
		default: false,
		describe: 'Sort repos by creation date (newest first)',
		type: 'boolean',
		})
		.option('sortByCreatedDateDesc', {
		default: false,
		describe: 'Sort repos by creation date (oldest first)',
		type: 'boolean',
		});
};
