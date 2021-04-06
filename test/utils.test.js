/* eslint-disable no-shadow */

'use strict';

const test = require('tape');
const logSymbols = require('log-symbols');
const { stdout } = require('../test/test-utils');
const { repositories } = require('./fixtures/fixtures.js');
const {
	listFields,
	getGroupByField,
	checkNull,
	printAPIPoints,
	generateTable,
	getSymbol,
} = require('../src/utils');

const fields = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'DefBranch', extract: (item) => item.defaultBranchRef?.name || '---' },
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

test('getGroupField', (t) => {
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
		const actualResult = generateTable(fields, repositories);

		console.log(actualResult, '******');

		// t.deepEqual(actualResult.toString() ,expectedResults.toString() );
		t.end();
	});

	t.test('return invalid output', (t) => {
		const actualResult = checkNull('');
		const expectedResults = '---';
		t.equal(expectedResults, actualResult);
		t.end();
	});
});

// get symbols
test('getSymbol,', (t) => {
	t.plan(2);
	t.test('return success symbol if value is true', (t) => {
		const expectedResults =	`${logSymbols.success}`;
		const actualResult = getSymbol(true);
		t.equal(expectedResults, actualResult);
		t.end();
	});

	t.test('return error symbol if value is false', (t) => {
		const expectedResults =	`${logSymbols.error}`;
		const actualResult = getSymbol(false);
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

