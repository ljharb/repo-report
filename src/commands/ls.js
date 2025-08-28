'use strict';

const getRepositories = require('../getRepositories');
const loadingIndicator = require('../loadingIndicator');
const Metrics = require('../../config/metrics');

module.exports = async function ls(flags) {
	// Get all repositories
	const { points, repositories } = await loadingIndicator(() => getRepositories(flags));
	if (flags.json) {
		const report = [];

		for (const repo of repositories) {
			const row = {};

			for (const [metricName, metric] of Object.entries(Metrics)) {
				if (!metric.dontPrint) {
					row[metricName] = metric.extract(repo);
				}
			}
			report.push(row);
		}
		const PointsAPI = points;
		report.push(PointsAPI);

		console.log(JSON.stringify(report, null, '\t'));
		return null;
	}

	repositories.forEach((repository) => {
		console.log(repository.nameWithOwner);
	});
	return null;
};
