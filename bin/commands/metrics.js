'use strict';

const Metrics = require('../../config/metrics');
const getMetrics = require('../../src/metrics');

const metricArgs = require('../metricArgs');

const {	listMetrics } = require('../../src/utils');

const metricData = getMetrics(Object.keys(Metrics));

module.exports.description = 'Show available metrics';

module.exports.builder = metricArgs;

module.exports.handler = () => {
	listMetrics(metricData);
};
