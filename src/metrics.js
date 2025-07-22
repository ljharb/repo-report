'use strict';

const Metrics = require('../config/metrics');

function mapper(name) {
	const {
		compare,
		dontPrint,
		extract,
		permissions,
	} = Metrics[name];
	return {
		compare,
		dontPrint,
		extract,
		name,
		permissions,
	};
}

module.exports = function getMetrics(metrics) {
	return metrics.map(mapper);
};
