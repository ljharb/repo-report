'use strict';

const test = require('tape');

const getMetrics = require('../../src/metrics');
const {
	listMetrics,
} = require('../../src/utils');

const metrics = getMetrics(['Repository', 'Access', 'DefBranch', 'isPrivate']);

test('listMetrics', (t) => {
	t.test('returns array of metric names', (st) => {
		const result = listMetrics(metrics);
		const expectedResults = ['Repository', 'Access', 'DefBranch', 'isPrivate'];
		st.deepEqual(result, expectedResults);

		st.end();
	});

	t.test('returns correct data structure', (st) => {
		const result = listMetrics(metrics);
		st.ok(Array.isArray(result), 'should return an array');
		st.equal(result.length, 4, 'should return correct number of items');
		st.ok(result.every((name) => typeof name === 'string'), 'all items should be strings');

		st.end();
	});

	t.end();
});
