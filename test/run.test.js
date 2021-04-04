/* eslint-disable no-shadow */

'use strict';

const test = require('tape');

const { createCLIWrapper } = require('../test/test-utils');
const { mockRepositoriesData } = require('./fixtures/fixtures.js');
const { mockGetRepositories } = require('./mocks.js');

test('list command', (t) => {
	t.plan(1);
	t.test('list command should return users repositories', async (t) => {
		const data = await mockGetRepositories(mockRepositoriesData);
		console.log(data.data.viewer.repositories, '&&&&&&&&&&&&');
		const wrapper = createCLIWrapper();
		const result = wrapper.run(['list']);
		console.log(result.stdout);
		t.end();
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

