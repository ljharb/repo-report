'use strict';

const cacheArgs = require('../cacheArgs');
const repoArgs = require('../repoArgs');
const metricArgs = require('../metricArgs');

const symbols = require('../../src/symbols');
const detail = require('../../src/commands/detail');

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

	return cacheArgs(repoArgs(metricArgs(commandArgs)));
};

module.exports.handler = detail;
