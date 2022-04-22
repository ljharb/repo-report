'use strict';

const test = require('tape');

const { stdout } = require('../test-utils');

const getMetrics = require('../../src/metrics');
const { listMetrics } = require('../../src/utils');

const metrics = getMetrics(['Repository', 'Access', 'DefBranch', 'isPrivate']);

test('listMetrics', (t) => {
	t.test('output each metric name', (st) => {
		const output = stdout();
		const expectedResults = ['- Repository\n', '- Access\n', '- DefBranch\n', '- isPrivate\n'];
		listMetrics(metrics);
		output.restore();
		st.deepEqual(output.loggedData, expectedResults);

		st.end();
	});

	t.test('output incorrect metric values', (st) => {
		const output = stdout();
		const expectedResults = ['- Repository\n- Access\n- DefBranch'];
		listMetrics(metrics);
		output.restore();
		st.notDeepEqual(output.loggedData, expectedResults);

		st.end();
	});

	t.end();
});
