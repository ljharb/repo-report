/* eslint-disable no-magic-numbers */

'use strict';

const {
	printAPIPoints,
	generateDetailTable,
} = require('../utils');
const getRepositories = require('../getRepositories');
const loadingIndicator = require('../loadingIndicator');

const getMetrics = require('../metrics');
const Metrics = require('../../config/metrics');
const ls = require('./ls');

// Metric names and their extraction method to be used on the query result (Order is preserved)
const metricNames = Object.keys(Metrics);

module.exports = async function detail(flags) {
	if (flags.json) {
		ls(flags);
		return null;
	}

	// Get all repositories
	const { points, repositories } = await loadingIndicator(() => getRepositories(flags));

	const metrics = getMetrics(flags.pick?.length > 0 ? [...new Set([
		'Repository',
		'isFork',
		'isPrivate',
		...metricNames.filter((name) => flags.pick.includes(name)),
	])] : metricNames);
	// Generate output table
	const table = generateDetailTable(metrics, repositories, {
		actual: flags.actual,
		all: flags.all,
		goodness: flags.goodness,
		sort: flags.sort,
		unactionable: flags.unactionable,
	});

	if (table) {
		console.log(String(table));
	}

	printAPIPoints(points);
	return null;
};
