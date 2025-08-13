'use strict';

const { mockRepositoriesData } = require('./fixtures/fixtures');
const { stdout } = require('./test-utils');
const test = require('tape');
const Module = require('module');
const path = require('path');
const getRepos = require('../src/getRepositories');

// Enhanced mock data with required fields for metrics
const enhancedRepos = mockRepositoriesData.data.viewer.repositories.nodes.map((repo) => ({
	...repo,
	hasIssuesEnabled: true,
	hasProjectsEnabled: false,
	hasDiscussionsEnabled: false,
	hasWikiEnabled: false,
	webCommitSignoffRequired: false,
	forkingAllowed: true,
	isArchived: false,
	autoMergeAllowed: false,
	isBlankIssuesEnabled: false,
	isSecurityPolicyEnabled: false,
	licenseInfo: { name: 'MIT License' },
	mergeCommitAllowed: true,
	squashMergeAllowed: true,
	rebaseMergeAllowed: true,
	deleteBranchOnMerge: false,
	squashMergeCommitTitle: 'COMMIT_OR_PR_TITLE',
	viewerHasStarred: false,
	viewerSubscription: 'SUBSCRIBED',
	codeOfConduct: { name: 'Contributor Covenant' },
	createdAt: '2020-01-01T00:00:00Z',
	updatedAt: '2023-01-01T00:00:00Z',
	pushedAt: '2023-01-01T00:00:00Z',
	isFork: false,
	isTemplate: false,
	owner: { login: 'name' },
}));

test('ls command returns correct data structure', (t) => {
	const output = stdout();
	const originalRequire = Module.prototype.require;

	// Set up mocks
	Module.prototype.require = function (id, ...args) {
		if (id === '../getRepositories') {
			return {
				...getRepos,
				async getRepositories() {
					return {
						repositories: enhancedRepos,
						points: { cost: 1, remaining: 4999 },
					};
				},
			};
		}
		if (id === '../loadingIndicator') {
			return (task) => task();
		}
		return originalRequire.apply(this, [id, ...args]);
	};

	// Clear cache and load the module after mocks are set up
	const lsPath = path.resolve(__dirname, '../src/commands/ls');
	delete require.cache[lsPath];
	const ls = originalRequire(lsPath);

	ls({}).then((result) => {
		try {
			t.ok(result && typeof result === 'object', 'ls should return an object');
			t.ok('points' in result, 'Should have points property');
			t.ok('repositories' in result, 'Should have repositories property');
			t.ok(Array.isArray(result.repositories), 'repositories should be an array');
			t.ok(result.repositories.length > 0, 'should have repositories');

			const firstRepo = result.repositories[0];
			t.ok(typeof firstRepo === 'object', 'repository should be an object');
			t.ok(typeof firstRepo.nameWithOwner === 'string', 'repository should have nameWithOwner');
			t.match(firstRepo.nameWithOwner, /^[^/]+\/[^/]+$/, 'nameWithOwner should be in owner/name format');

			t.ok(typeof result.points === 'object', 'points should be an object');
			t.ok(typeof result.points.cost === 'number', 'points should have cost');
			t.ok(typeof result.points.remaining === 'number', 'points should have remaining');

			Module.prototype.require = originalRequire;
			output.restore();
			t.end();
		} catch (error) {
			Module.prototype.require = originalRequire;
			output.restore();
			t.error(error);
		}
	}).catch((error) => {
		Module.prototype.require = originalRequire;
		output.restore();
		t.error(error);
	});
});
