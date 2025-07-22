/* eslint-disable no-shadow */

'use strict';

const Metrics = require('../config/metrics');
const validateConfig = require('./validate');
const config = require('./fixtures/metricConfig.json');

const test = require('tape');

test('checkMetrics', (t) => {
	t.test('if compare present it should be a function', (t) => {
		Object.keys(Metrics)
			.filter((metric) => 'compare' in Metrics[metric])
			.forEach((metric) => {
				t.ok(typeof Metrics[metric].compare, 'function', `when ${metric} compare is present, it is a function`);
			});

		t.end();
	});

	t.test('permission should be an array if present', (t) => {
		Object.keys(Metrics)
			.filter((metric) => 'permissions' in Metrics[metric])
			.forEach((metric) => {
				t.ok(Array.isArray(Metrics[metric].permissions), `when ${metric} permissions is present, it is an array`);
			});

		t.end();
	});

	t.test('extraction methods present for all metrics and is of type function', (t) => {
		Object.keys(Metrics).forEach((metric) => {
			t.equal(typeof Metrics[metric].extract, 'function', `${metric} extract is a function`);
		});

		t.end();
	});

	t.test('validate static members', (t) => {
		const errors = validateConfig(config);
		t.deepEqual(errors, [], 'should have no errors');

		t.end();
	});

	t.end();
});
