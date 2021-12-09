'use strict';

const test = require('tape');

const { stdout } = require('../test-utils');

const { listMetrics } = require('../../src/utils');

const metrics = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'DefBranch', extract: (item) => (item.defaultBranchRef || {}).name || '---' },
	{ name: 'isPrivate', extract: (item) => item.isPrivate, dontPrint: true },
];

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
