'use strict';

const Metrics = require('../config/metrics');

module.exports = function metricArgs(yargs) {
	return yargs
		.option('all', {
			default: false,
			describe: 'Show all metrics',
			type: 'boolean',
		})

		.option('pick', {
			alias: 'p',
			choices: Object.keys(Metrics),
			describe: 'Pick metrics',
		})
		.check(({ all, pick }) => !all || !(pick?.length > 0) || '`--all` and `--pick` are mutually exclusive');
};
