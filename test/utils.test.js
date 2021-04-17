/* eslint-disable no-shadow */

'use strict';

const test = require('tape');
const Table = require('cli-table');
const logSymbols = require('log-symbols');
const { stdout } = require('../test/test-utils');

const { mockRepositoriesData: { data: { viewer: { repositories } } },
	tableOutput,
	sortedRepositories,
	tableData,
	sortedTableData,
} = require('./fixtures/fixtures');

const {
	listFields,
	getGroupByField,
	checkNull,
	printAPIPoints,
	generateTable,
	getSymbol,
	createTable,
	generateTableData,
	sortRows,
} = require('../src/utils');

const fields = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'DefBranch', extract: (item) => (item.defaultBranchRef || {}).name || '---' },
	{
		name: 'isPrivate', extract: (item) => item.isPrivate, dontPrint: true,
	},
];

test('listFields', (t) => {
	t.plan(2);
	t.test('output each field name', (t) => {
		const output = stdout();
		const expectedResults = ['- Repository\n', '- Access\n', '- DefBranch\n', '- isPrivate\n'];
		listFields(fields);
		output.restore();
		t.deepEqual(output.loggedData, expectedResults);
		t.end();
	});

	t.test('output incorrect field values', (t) => {
		const output = stdout();
		const expectedResults = ['- Repository\n- Access\n- DefBranch'];
		listFields(fields);
		output.restore();
		t.notDeepEqual(output.loggedData, expectedResults);
		t.end();
	});
});

test('getGroupByField', (t) => {
	t.plan(2);
	t.test('return the correct field', (t) => {
		const actualField = getGroupByField('Access', fields);
		const expectedResults = { name: 'Access', extract: (item) => item.viewerPermission };
		t.equal(expectedResults.toString(), actualField.toString());
		t.end();
	});

	t.test('return null when the field is not present', (t) => {
		const output = stdout();
		const actualField = getGroupByField('newAccess', fields);
		const expectedResults = null;
		output.restore();
		t.deepEqual(output.loggedData, [`${logSymbols.error} Invalid Field\n`]);
		t.deepEqual(expectedResults, actualField);
		t.end();
	});
});

test('checkNull', (t) => {
	t.plan(2);
	t.test('return value when it is not null', (t) => {
		const valueToBeChecked = 'access';
		const actualResult = checkNull(valueToBeChecked);
		const expectedResults = valueToBeChecked;
		t.equal(expectedResults, actualResult);
		t.end();
	});

	t.test('return --- when value is null', (t) => {
		let valueToBeChecked;
		const actualResult = checkNull(valueToBeChecked);
		const expectedResults = '---';
		t.equal(expectedResults, actualResult);
		t.end();
	});
});

test('generateTable,', (t) => {
	t.plan(2);
	t.test('return a generated table', (t) => {
		const actualResult = generateTable(fields, repositories.nodes);
		t.deepEqual(JSON.stringify(actualResult), JSON.stringify(tableOutput));
		t.end();
	});

	const columns = [
		{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
		{ name: 'Access', extract: (item) => item.viewerPermission },
		{ name: 'branch', extract: (item) => item.defaultBranchRef?.name || '---' },
	];
	t.test('return invalid output', (t) => {
		const actualResult = generateTable(columns, repositories.nodes);
		t.notDeepEqual(JSON.stringify(actualResult), JSON.stringify(tableOutput));
		t.end();
	});
});

// get symbols
test('getSymbol,', (t) => {
	t.plan(2);
	t.test('return success symbol if value is true', (t) => {
		const expectedResults =	true;
		const actualResult = getSymbol(true);
		t.equal(expectedResults, actualResult);
		t.end();
	});

	t.test('return error symbol if value is false', (t) => {
		const expectedResults =	false;
		const actualResult = getSymbol('');
		t.equal(expectedResults, actualResult);
		t.end();
	});
});

test('printAPIPoints,', (t) => {
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

test('sortRows', (t) => {
	const repositoriesData = [...repositories.nodes];
	t.test('return the repositories correctly sorted', (t) => {
		const actualResult = sortRows(repositories.nodes);
		t.deepEqual(actualResult, sortedRepositories);
		t.end();
	});

	t.test('return the repositories correctly sorted', (t) => {
		const result = sortRows(repositories.nodes);
		t.notDeepEqual(result, repositoriesData);
		t.end();
	});
});

test('generateTableData', (t) => {
	const fields = [
		{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
		{ name: 'Access', extract: (item) => item.viewerPermission },
		{ name: 'DefBranch', extract: (item) => item.defaultBranchRef?.name || '---' },
		{
			name: 'isPrivate', extract: (item) => item.isPrivate, dontPrint: true,
		},
	];

	t.test(' generateTableData returns the correct table data required to generate a table', (t) => {
		const actualResult = generateTableData(fields, [...repositories.nodes]);
		t.deepEqual(actualResult, tableData);
		t.end();
	});

	t.test('generateTableData returns the correct sorted table data required to generate a table', (t) => {
		const actualResult = generateTableData(fields, [...repositories.nodes], '', true);
		t.deepEqual(actualResult, sortedTableData);
		t.end();
	});

	t.test('generateTableData returns the correct table data grouped as by access', (t) => {
		const groupByAccess = 	{ name: 'Access', extract: (item) => item.viewerPermission };
		const actualResult = generateTableData(fields, [...repositories.nodes], groupByAccess, true);
		t.deepEqual(actualResult.head, ['Access', 'Repository', 'DefBranch']);
		t.end();
	});

	t.test('generateTableData returns the wrong table data when grouped as by access', (t) => {
		const groupByDefBranch = 	{ name: 'DefBranch', extract: (item) => item.defaultBranchRef?.name || '---' };
		const actualResult = generateTableData(fields, [...repositories.nodes], groupByDefBranch, true);
		t.notDeepEqual(actualResult.head, ['Repository', 'Access', 'DefBranch']);
		t.end();
	});

});

test('createTable', (t) => {

	t.test('return correctly generated values for table row 0 given the right data is passed', (t) => {
		const table = createTable(tableData);
		t.ok(table instanceof Table);
		t.deepEqual(table[0], ['name/challenges-book', 'ADMIN', 'master']);
		t.end();
	});

	t.test('return correctly generated values for table header given the right data is passed', (t) => {
		const table = createTable(tableData);
		t.ok(table instanceof Table);
		t.deepEqual(table.options.head, ['Repository', 'Access', 'DefBranch']);
		t.end();
	});

	t.test('returns correctlength of table given the right data is passed', (t) => {
		const table = createTable(tableData);
		t.equal(table.length, 6);
		t.end();
	});
});

