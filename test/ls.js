'use strict';

const { mockRepositoriesData } = require('./fixtures/fixtures');
const { stdout } = require('./test-utils');
const test = require('tape');
const Module = require('module');
const path = require('path');

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

test('ls command JSON output', (t) => {
	const output = stdout();
	const originalRequire = Module.prototype.require;

	// Set up mocks
	Module.prototype.require = function (id, ...args) {
		if (id === '../getRepositories') {
			return () => Promise.resolve({
				repositories: enhancedRepos,
				points: { cost: 1, remaining: 4999 },
			});
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

	ls({ json: true }).then(() => {
		try {
			// Find the JSON output among all logged data
			const jsonString = output.loggedData.find((item) => typeof item === 'string' && item.trim().startsWith('['));

			if (!jsonString) {
				throw new Error(`No JSON array found in logged data. Items: ${output.loggedData.map((item) => item.substring(0, 30)).join(', ')}`);
			}

			const obj = JSON.parse(jsonString);
			const firstRepo = obj[0];

			// === Test Assertions ===
			t.ok(Array.isArray(obj), 'JSON output should be an array of repositories');
			t.ok(obj.length > 0, 'should have repositories');
			t.ok(typeof firstRepo?.repository === 'string', 'repository should be a string');
			t.match(firstRepo?.repository, /^[^/]+\/[^/]+$/, 'repository should be in owner/name format');
			t.ok('Access' in firstRepo, 'Should have an Access field');

			const validAccess = ['ADMIN', 'WRITE', 'READ', 'TRIAGE', 'MAINTAIN'];
			t.ok(validAccess.includes(firstRepo?.Access), 'Access should include a valid permission');
			t.ok('DefBranch' in firstRepo, 'Should have a DefBranch field');

			const validBranch = ['main', 'master', 'develop'];
			t.ok(validBranch.includes(firstRepo?.DefBranch), 'DefBranch should have a valid branch');

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
