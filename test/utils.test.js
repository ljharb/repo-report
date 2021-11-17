/* eslint-disable no-shadow */

'use strict';

const Metrics = require('../config/metrics');
const validateConfig = require('./validate');
const config = require('./fixtures/metricConfig.json');

const test = require('tape');
const { stdout } = require('../test/test-utils');

const {
	mockRepositoriesData: { data: { viewer: { repositories } } },
	tableOutput,
	tableOutputActual,
} = require('./fixtures/fixtures');

const {
	listMetrics,
	printAPIPoints,
	generateDetailTable,
} = require('../src/utils');

const metrics = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'DefBranch', extract: (item) => (item.defaultBranchRef || {}).name || '---' },
	{ name: 'isPrivate', extract: (item) => item.isPrivate, dontPrint: true },
];

test('listMetrics', (t) => {
	t.plan(2);

	t.test('output each metric name', (t) => {
		const output = stdout();
		const expectedResults = ['- Repository\n', '- Access\n', '- DefBranch\n', '- isPrivate\n'];
		listMetrics(metrics);
		output.restore();
		t.deepEqual(output.loggedData, expectedResults);
		t.end();
	});

	t.test('output incorrect metric values', (t) => {
		const output = stdout();
		const expectedResults = ['- Repository\n- Access\n- DefBranch'];
		listMetrics(metrics);
		output.restore();
		t.notDeepEqual(output.loggedData, expectedResults);
		t.end();
	});
});

test('printAPIPoints', (t) => {
	t.plan(2);

	t.test('returns the API points correctly', (t) => {
		const output = stdout();
		const expectedResults = ['API Points:\n  \tused\t\t-\t2\n  \tremaining\t-\t4997\n'];
		printAPIPoints({ cost: 2, remaining: 4997 });
		output.restore();
		t.deepEqual(output.loggedData, expectedResults);
		t.end();
	});

	t.test('checks if API points is not correct', (t) => {
		const output = stdout();
		const expectedResults = ['API Points:\n  \tused\t\t-\t3\n  \tremaining\t-\t4997\n'];

		printAPIPoints({ cost: 2, remaining: 4997 });
		output.restore();
		t.notDeepEqual(output.loggedData, expectedResults);
		t.end();
	});
});

test('generateDetailTable,', (t) => {
	t.plan(3);

	t.test('return a generated detail table', (t) => {
		const actualResult = generateDetailTable(metrics, repositories.nodes, { goodness: true });
		t.deepEqual(actualResult, tableOutput);
		t.end();
	});

	t.test('return a generated detail table with --actual option', (t) => {
		const actualResult = generateDetailTable(metrics, repositories.nodes, { actual: true });
		t.deepEqual(actualResult, tableOutputActual);
		t.end();
	});

	const columns = [
		{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
		{ name: 'Access', extract: (item) => item.viewerPermission },
		{ name: 'branch', extract: (item) => (item.defaultBranchRef || {}).name || '---' },
	];

	t.test('return invalid output', (t) => {
		const actualResult = generateDetailTable(columns, repositories.nodes);
		t.notDeepEqual(actualResult, tableOutput);
		t.end();
	});
});

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
