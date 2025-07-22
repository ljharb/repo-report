'use strict';

const colors = require('colors/safe');

module.exports = {
	error: colors.red('✖'),
	fork: '🍴',
	ignore: '🤷',
	info: colors.blue('ℹ'),
	isPrivate: '🔒',
	success: colors.green('✔'),
	unactionable: '🙅',
	warning: colors.yellow('⚠️'),
};
