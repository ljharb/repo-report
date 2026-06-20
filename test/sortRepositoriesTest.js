'use strict';

const test = require('tape');
const mockRepositoriesData = require('./fixtures/mockRepositoriesData.json');

/** @import { Repository } from '../src/types' */

const { nodes: rawNodes } = mockRepositoriesData.data.viewer.repositories;
const getRepositories = () => /** @type {Repository[]} */ (/** @type {unknown} */ (rawNodes));

const { sortRepositories } = require('../src/getRepositories');

/** @returns {Repository[]} */
function cloneData() {
	return JSON.parse(JSON.stringify(getRepositories()));
}

test('Sort by name ASC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'name', desc: false });
	const expected = cloneData().toSorted((a, b) => a.name.localeCompare(b.name));
	t.deepEqual(actual, expected, 'Repos are sorted by name A → Z');
	t.end();
});

test('Sort by name DESC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'name', desc: true });
	const expected = cloneData().toSorted((a, b) => b.name.localeCompare(a.name));
	t.deepEqual(actual, expected, 'Repos are sorted by name Z → A');
	t.end();
});

test('Sort by updated date DESC (default)', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'updated', desc: false });
	const expected = cloneData().toSorted((a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)));
	t.deepEqual(actual, expected, 'Repos are sorted by updated newest → oldest');
	t.end();
});

test('Sort by updated date ASC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'updated', desc: true });
	const expected = cloneData().toSorted((a, b) => Number(new Date(a.updatedAt)) - Number(new Date(b.updatedAt)));
	t.deepEqual(actual, expected, 'Repos are sorted by updated oldest → newest');
	t.end();
});

test('Sort by created date DESC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'created', desc: false });
	const expected = cloneData().toSorted((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
	t.deepEqual(actual, expected, 'Repos are sorted by created date newest → oldest');
	t.end();
});

test('Sort by created date ASC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'created', desc: true });
	const expected = cloneData().toSorted((a, b) => Number(new Date(a.createdAt)) - Number(new Date(b.createdAt)));
	t.deepEqual(actual, expected, 'Repos are sorted by created date oldest → newest');
	t.end();
});
