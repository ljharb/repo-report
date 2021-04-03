'use strict';

const test = require('tape');
const createCLIWrapper = require('../test/test-utils');

test('list command', (t) => {
	t.plan(2);
	t.test('list command should return users repositories', (t) => {
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['list']);
		console.log(result.stdout);
	});

	/*
	 * t.test('list -g field to groupby\' should return output', (t) => {
	 * 	const wrapper = createCLIWrapper();
	 * 	const result = wrapper.run(['list']);
	 * 	console.log(result.stdout);
	 * });
	 */

	/*
	 * t.test('\'-f list all the fields', (t) => {
	 * 	const wrapper = createCLIWrapper();
	 * 	const result = wrapper.run(['list', '-f']);
	 */

	/*
	 * 	console.log(result);
	 * 	t.end();
	 * });
	 * t.test('\'-f list all the fields', (t) => {
	 * 	const wrapper = createCLIWrapper();
	 * 	const result = wrapper.run(['list', '-s']);
	 * 	// console.log(result);
	 * 	t.end();
	 * });
	 */

});

