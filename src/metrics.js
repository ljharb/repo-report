'use strict';

const Metrics = require('../config/metrics.js');

const getMetrics = (metrics) => {
	const out = metrics.map((name) => {
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
	});
	return out;
};

module.exports = { getMetrics };
