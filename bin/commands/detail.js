'use strict';

const cacheArgs = require('../cacheArgs');
const repoArgs = require('../repoArgs');
const formatArgs = require('../formatArgs');
const metricArgs = require('../metricArgs');

const symbols = require('../../src/symbols');
const detail = require('../../src/commands/detail');
const {
	printAPIPoints,
} = require('../../src/utils');

module.exports.description = `Fetch actionable details about your public, source (non-fork, non-template) repositories. Unactionable metrics are converted to ${symbols.success} by default.`;

module.exports.command = '*';

module.exports.builder = (yargs) => {
	const commandArgs = yargs
		.usage('Usage: $0 [options]')

		.option('unactionable', {
			default: false,
			describe: `Shows values of metrics you lack permissions to change, with a ${symbols.unactionable} next to it`,
			type: 'boolean',
		})
		.option('actual', {
			default: false,
			describe: 'Show metrics’ true values',
			type: 'boolean',
		})
		.option('goodness', {
			default: true,
			describe: 'Prefix actual values with goodness values',
			type: 'boolean',
		})
		.check(({ goodness, actual }) => goodness || actual || 'At least one of `--goodness` and `--actual` must be set.')
		.option('metrics', {
			alias: 'm',
			default: false,
			describe: 'Show available metrics',
			type: 'boolean',
		})
		.help('help')
		.strict();

	return cacheArgs(repoArgs(metricArgs(formatArgs(commandArgs))));
};

module.exports.handler = async (flags) => {
	const {
		metrics,
		points,
		repositories,
		table,
	} = await detail(flags);

	if (flags.json) {
		/* eslint function-paren-newline: 0 */
		const report = repositories.map((repo) => Object.fromEntries(
			Object.entries(metrics).flatMap((metric) => (
				metric.dontPrint
					? []
					: [[metric.name, metric.extract(repo)]]
			)),
		)).concat(points);

		console.log(JSON.stringify(report, null, '\t'));
	} else {
		if (table) {
			console.log(String(table));
		}
		printAPIPoints(points);
	}
};
