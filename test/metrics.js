/* eslint-disable no-shadow */

'use strict';

/** @import { Repository } from '../src/types' */

const Metrics = require('../config/metrics');
const validateConfig = require('./validate');
const config = require('./fixtures/metricConfig.json');

const test = require('tape');

test('checkMetrics', (t) => {
	t.test('if compare present it should be a function', (t) => {
		Object.keys(Metrics)
			.filter((metric) => 'compare' in Metrics[metric])
			.forEach((metric) => {
				t.equal(typeof Metrics[metric].compare, 'function', `when ${metric} compare is present, it is a function`);
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

	t.test('ReqCodeOwnerReviews extracts the requiresCodeOwnerReviews rule', (t) => {
		/** @type {(value: boolean) => Repository} */
		const repoWithCodeOwnerRule = (value) => /** @type {Repository} */ (/** @type {unknown} */ ({
			defaultBranchRef: { branchProtectionRule: { requiresCodeOwnerReviews: value } },
		}));
		const required = repoWithCodeOwnerRule(true);
		const notRequired = repoWithCodeOwnerRule(false);

		t.equal(Metrics.ReqCodeOwnerReviews.extract(required), true, 'true when the rule requires code owner reviews');
		t.equal(Metrics.ReqCodeOwnerReviews.extract(notRequired), false, 'false when the rule does not');

		t.end();
	});

	t.end();
});
