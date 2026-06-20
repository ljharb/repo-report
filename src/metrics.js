'use strict';

/** @import { NamedMetric } from './types' */

const Metrics = require('../config/metrics');

/** @type {(name: string) => NamedMetric} */
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

/** @type {(metrics: string[]) => NamedMetric[]} */
module.exports = function getMetrics(metrics) {
	return metrics.map(mapper);
};
