'use strict';

const cacheArgs = require('../cacheArgs');
const repoArgs = require('../repoArgs');
const formatArgs = require('../formatArgs');

const ls = require('../../src/commands/ls');
const Metrics = require('../../config/metrics');

module.exports.description = `Lists all repositories.
- Includes sources, forks, templates, private, and public repos by default.`;

module.exports.builder = (yargs) => cacheArgs(repoArgs(formatArgs(yargs)))
	.default('actual', true)
	.hide('actual')
	.default('focus', () => ['sources', 'forks', 'templates', 'private', 'public']);

module.exports.handler = async (flags) => {
	const {
		points,
		repositories,
	} = await ls(flags);

	if (flags.json) {
		/* eslint function-paren-newline: 0 */
		const report = repositories.map((repo) => Object.fromEntries(
			Object.entries(Metrics).flatMap(([metricName, metric]) => (
				metric.dontPrint
					? []
					: [[metricName, metric.extract(repo)]]
			)),
		)).concat(points);

		console.log(JSON.stringify(report, null, '\t'));
	} else {
		repositories.forEach((repository) => {
			console.log(repository.nameWithOwner);
		});
	}
};
