'use strict';

const test = require('tape');

const { generateDetailTable } = require('../../src/utils');

const {
	mockRepositoriesData: { data: { viewer: { repositories } } },
	tableOutput,
	tableOutputActual,
	tableOutputActualGoodness,
} = require('../fixtures/fixtures');

const getMetrics = require('../../src/metrics');

const metrics = getMetrics(['Repository', 'Access', 'DefBranch', 'isPrivate', 'SecurityPolicyEnabled', 'CodeOfConduct', 'RequiredBranchProtectionSourcePercentage', 'RequireLastPushApproval', 'RequireBranchesBeUpToDateBeforeMerging']);

function compareTables(t, actual, expected, msg, invalid = false) {
	const comparator = invalid ? 'notDeepEqual' : 'deepEqual';
	t.test(msg, (st) => {
		if (!invalid) {
			st[comparator](
				actual.options.head,
				expected.options.head,
				'table heads are deepEqual',
			);
			const { head: _, ...actualOpts } = actual.options;
			const { head: __, ...expectedOpts } = expected.options;
			st[comparator](
				actualOpts,
				expectedOpts,
				'table options are deepEqual',
			);
		}
		const a = Array.prototype.slice.call(actual);
		const b = Array.prototype.slice.call(expected);
		for (let i = 0; i < a.length; i++) {
			st[comparator](a[i], b[i], `row ${i} is ${invalid ? 'not ' : ''}deepEqual`);
		}

		st[comparator](
			Array.prototype.slice.call(actual),
			Array.prototype.slice.call(expected),
			'deepEqual when coerced to array',
		);
		st.end();
	});
}

test('generateDetailTable,', (t) => {
	compareTables(
		t,
		generateDetailTable(metrics, repositories.nodes, { goodness: true }),
		tableOutput,
		'return a generated detail table',
	);

	compareTables(
		t,
		generateDetailTable(metrics, repositories.nodes, { actual: true }),
		tableOutputActual,
		'return a generated detail table with --actual option',
	);

	compareTables(
		t,
		generateDetailTable(metrics, repositories.nodes, { actual: true, goodness: true }),
		tableOutputActualGoodness,
		'return a generated detail table with --actual and --goodness option',
	);

	compareTables(
		t,
		generateDetailTable(metrics, repositories.nodes),
		tableOutput,
		'return invalid output',
		true,
	);

	t.end();
});
