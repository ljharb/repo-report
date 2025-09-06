'use strict';

const test = require('tape');
const mockRepositoriesData = require('./fixtures/mockRepositoriesData.json');

const getRepositories = () => mockRepositoriesData.data.viewer.repositories.nodes;

const { sortRepositories } = require('../src/getRepositories');

/** @return {ReturnType<typeof getRepositories>} */
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
	const expected = cloneData().toSorted((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
	t.deepEqual(actual, expected, 'Repos are sorted by updated newest → oldest');
	t.end();
});

test('Sort by updated date ASC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'updated', desc: true });
	const expected = cloneData().toSorted((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
	t.deepEqual(actual, expected, 'Repos are sorted by updated oldest → newest');
	t.end();
});

test('Sort by created date DESC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'created', desc: false });
	const expected = cloneData().toSorted((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	t.deepEqual(actual, expected, 'Repos are sorted by created date newest → oldest');
	t.end();
});

test('Sort by created date ASC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'created', desc: true });
	const expected = cloneData().toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
	t.deepEqual(actual, expected, 'Repos are sorted by created date oldest → newest');
	t.end();
});
