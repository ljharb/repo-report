'use strict';

const Metrics = require('../config/metrics.js');

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
