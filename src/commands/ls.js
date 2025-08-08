'use strict';

const getRepositories = require('../getRepositories');
const loadingIndicator = require('../loadingIndicator');
const Metrics = require('../../config/metrics'); // Change to import Metrics directly

module.exports = async function ls(flags) {
	let filter;
	if (flags.focus?.length === 1 && flags.focus[0] === 'templates') {
		filter = (repo) => repo.isTemplate;
	}

	// Get all repositories
	const { repositories } = await loadingIndicator(() => getRepositories(flags, filter));

	if (flags.json) {
		const report = [];

		for (const repo of repositories) {
			const row = { repository: repo.nameWithOwner };

			// Use the full Metrics object to get all available metrics
			for (const [metricName, metric] of Object.entries(Metrics)) {
				if (!metric.dontPrint) {
					row[metricName] = metric.extract(repo);
				}
			}
			report.push(row);
		}

		console.log(JSON.stringify(report, null, 2));
		return;
	}

	repositories.forEach((repository) => {
		console.log(repository.nameWithOwner);
	});
};
