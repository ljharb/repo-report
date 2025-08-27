'use strict';

const test = require('tape');
const mockRepositoriesData = require('./fixtures/mockRepositoriesData.json');

const getRepositories = () => mockRepositoriesData.data.viewer.repositories.nodes;

const { sortRepositories } = require('../src/getRepositories');

function cloneData() {
	return JSON.parse(JSON.stringify(getRepositories()));
}

test('Sort by name ASC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'name', reverse: false });
	const expected = [...cloneData()].sort((a, b) => a.name.localeCompare(b.name));
	t.deepEqual(actual, expected, 'Repos should be sorted by name A → Z');
	t.end();
});

test('Sort by name DESC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'name', reverse: true });
	const expected = [...cloneData()].sort((a, b) => b.name.localeCompare(a.name));
	t.deepEqual(actual, expected, 'Repos should be sorted by name Z → A');
	t.end();
});

test('Sort by updatedDate DESC (default)', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'updatedDate', reverse: false });
	const expected = [...cloneData()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
	t.deepEqual(actual, expected, 'Repos should be sorted by updatedDate newest → oldest');
	t.end();
});

test('Sort by updatedDate ASC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'updatedDate', reverse: true });
	const expected = [...cloneData()].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
	t.deepEqual(actual, expected, 'Repos should be sorted by updatedDate oldest → newest');
	t.end();
});

test('Sort by createdDate DESC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'createdDate', reverse: false });
	const expected = [...cloneData()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	t.deepEqual(actual, expected, 'Repos should be sorted by createdDate newest → oldest');
	t.end();
});

test('Sort by createdDate ASC', (t) => {
	const repos = cloneData();
	const actual = sortRepositories(repos, { sort: 'createdDate', reverse: true });
	const expected = [...cloneData()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
	t.deepEqual(actual, expected, 'Repos should be sorted by createdDate oldest → newest');
	t.end();
});
