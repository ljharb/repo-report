'use strict';

const colors = require('colors/safe');

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
			describe: '--sort is deprecated. Use --sortBy.',
			hidden: true,
			type: 'boolean',
		})
		.option('sortBy', {
			alias: 'sb',
			describe: 'Sort repositories by field such as name or updatedDate or createdDate.',
			type: 'string',
		})
		.option('reverse', {
			alias: 'r',
			default: false,
			describe: 'Sort in reverse',
			type: 'boolean',
		})
		.check((argv) => {
			if (argv.sort && argv.sortBy !== undefined) {
				console.log(colors.red('Do not use --sort and --sortBy together. --sort is deprecated. Use --sortBy.'));
				process.exit(1);
			}
			if (!argv.sort) {
				if (argv.sortBy && !['', 'name', 'updatedDate', 'createdDate'].includes(argv.sortBy)) {
					console.log(colors.red(`Invalid Field name: ${argv.sortBy}!! Use field such as name or updatedDate or createdDate.`));
					process.exit(1);
				}
			}
			return true;
		});
};
