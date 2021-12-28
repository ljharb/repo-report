'use strict';

const test = require('tape');

const { generateDetailTable } = require('../../src/utils');

const {
	mockRepositoriesData: { data: { viewer: { repositories } } },
	tableOutput,
	tableOutputActual,
} = require('../fixtures/fixtures');

const metrics = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'DefBranch', extract: (item) => (item.defaultBranchRef || {}).name || '---' },
	{ name: 'isPrivate', extract: (item) => item.isPrivate, dontPrint: true },
];

test('generateDetailTable,', (t) => {
	t.deepEqual(
		generateDetailTable(metrics, repositories.nodes, { goodness: true }),
		tableOutput,
		'return a generated detail table',
	);

	t.deepEqual(
		generateDetailTable(metrics, repositories.nodes, { actual: true }),
		tableOutputActual,
		'return a generated detail table with --actual option',
	);

	const columns = [
		{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
		{ name: 'Access', extract: (item) => item.viewerPermission },
		{ name: 'branch', extract: (item) => (item.defaultBranchRef || {}).name || '---' },
	];

	t.notDeepEqual(
		generateDetailTable(columns, repositories.nodes),
		tableOutput,
		'return invalid output',
	);

	t.end();
});
