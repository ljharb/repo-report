'use strict';

const test = require('tape');
const createCLIWrapper = require('../test/test-utils');

test('list command', (t) => {

	t.plan(2);
	t.test('\'-g field to groupby\' should return output', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['list', '-g', 'access']);
		console.log(result);

		t.end();
	});

	t.test('\'-f list all the fields', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['list', '-f']);

		// console.log(result);
		t.end();
	});
	t.test('\'-f list all the fields', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['list', '-s']);

		// console.log(result);
		t.end();
	});

});

test('detail command', (t) => {

	t.plan(2);
	t.test('\'-g field to groupby\' should return output', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['detail', '-g', 'access']);
		console.log(result);

		t.end();
	});

	t.test('\'-f list all the fields', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['detail', '-f']);

		// console.log(result);
		t.end();
	});
	t.test('\'-f list all the fields', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['detail', '-s']);

		// console.log(result);
		t.end();
	});

});
test('branch protection command', (t) => {

	t.plan(2);
	t.test('\'-g field to groupby\' should return output', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['branchProtection', '-g', 'access']);
		console.log(result);

		t.end();
	});

	t.test('\'-f list all the fields', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['branchProtection', '-f']);

		// console.log(result);
		t.end();
	});
	t.test('\'-f list all the fields', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['branchProtection', '-s']);

		// console.log(result);
		t.end();
	});

});
test('options command', (t) => {

	t.plan(2);
	t.test('\'-g field to groupby\' should return output', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['options', '-g', 'access']);
		console.log(result);

		t.end();
	});

	t.test('\'-f list all the fields', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['options', '-f']);

		// console.log(result);
		t.end();
	});
	t.test('\'-f list all the fields', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['options', '-s']);

		// console.log(result);
		t.end();
	});

});
