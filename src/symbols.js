'use strict';

const { styleText } = require('util');

module.exports = {
	error: styleText('red', '✖'),
	fork: '🍴',
	ignore: '🤷',
	info: styleText('blue', 'ℹ'),
	isPrivate: '🔒',
	success: styleText('green', '✔'),
	unactionable: '🙅',
	warning: styleText('yellow', '⚠️'),
};
