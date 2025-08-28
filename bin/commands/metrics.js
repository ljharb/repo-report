'use strict';

const Metrics = require('../../config/metrics');
const getMetrics = require('../../src/metrics');

const metricArgs = require('../metricArgs');
const formatArgs = require('../formatArgs');

const {	listMetrics } = require('../../src/utils');

const metricData = getMetrics(Object.keys(Metrics));

module.exports.description = 'Show available metrics';

module.exports.builder = (yargs) => formatArgs(metricArgs(yargs));

module.exports.handler = (flags) => {
	if (flags.json) {
		console.log(JSON.stringify(Object.keys(Metrics), null, '\t'));
		return;
	}
	listMetrics(metricData);
};
