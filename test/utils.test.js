'use strict';

const test = require('tape');
const {
	listFields,
	getGroupByField,
	checkNull,
	printAPIPoints,
	generateTable,
	getRepositories,
	getSymbol,
} = require('../src/utils');

const fields = [{ name: 'Repository' }, { name: 'Access' }, { name: 'DefBranch' }];

test('listFields', (t) => {
	t.plan(2);
	t.test('output each field', (t) => {
		const expectedResults = ['- Repository\n- Access\n- DefBranch'];
		console.log(listFields(fields), expectedResults);
		t.end();
	});
	t.test('output incorrect field values', (t) => {
		const expectedResults = ['- Repository\n- Access\n- DefBranch'];
		console.log(listFields(fields), expectedResults);
		t.end();
	});
});

test('getGroupField', (t) => {
	t.plan(2);
	t.test('return the correct field', (t) => {
		const actualField = getGroupByField('access', fields);
		const expectedResults = { name: 'Access' };
		t.deepEqual(expectedResults, actualField);
		t.end();
	});
	t.test('return null when the field is not present', (t) => {
		const actualField = getGroupByField('newAccess', fields);
		const expectedResults = null;
		console.log(expectedResults, actualField);
		t.equal(expectedResults, actualField);
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

// generate table
test('generateTable,', (t) => {
	t.plan(2);
	t.test('return a generated table', (t) => {
		const actualResult = generateTable('');
		t.equal(expectedResults, actualResult);
		t.end();
	});

	t.test('return --- when value is null', (t) => {
		const actualResult = checkNull('');
		const expectedResults = '---';
		t.equal(expectedResults, actualResult);
		t.end();
	});
});
// get repositories
test('getRepositories,', (t) => {
	t.plan(2);
	t.test('return a generated table', (t) => {
		const actualResult = getRepositories('');
		t.equal(expectedResults, actualResult);
		t.end();
	});

	t.test('return --- when value is null', (t) => {
		const actualResult = checkNull('');
		const expectedResults = '---';
		t.equal(expectedResults, actualResult);
		t.end();
	});
});

// get symbols
test('getSymbol,', (t) => {
	t.plan(2);
	t.test('return a generated table', (t) => {
		const actualResult = getSymbol('');
		t.equal(expectedResults, actualResult);
		t.end();
	});

	t.test('return --- when value is null', (t) => {
		const actualResult = checkNull('');
		const expectedResults = '---';
		t.equal(expectedResults, actualResult);
		t.end();
	});
});

test('printAPIPoints,', (t) => {
	t.plan(2);
	t.test('return a generated table', (t) => {
		const actualResult = printAPIPoints('');
		t.equal(expectedResults, actualResult);
		t.end();
	});

	t.test('return --- when value is null', (t) => {
		const actualResult = checkNull('');
		const expectedResults = '---';
		t.equal(expectedResults, actualResult);
		t.end();
	});
});

