'use strict';

const test = require('tape');
const Module = require('module');

const Metrics = require('../config/metrics');
const mockGraphQL = require('./mocks');

const utilsPath = require.resolve('../src/utils');
const getRepositoriesPath = require.resolve('../src/getRepositories');

test('getRepositories (GraphQL integration)', (t) => {
	const repoNode = {
		name: 'repo',
		nameWithOwner: 'owner/repo',
		isFork: false,
		isPrivate: false,
		viewerPermission: 'ADMIN',
		defaultBranchRef: {
			name: 'main',
			branchProtectionRule: {
				requiresCodeOwnerReviews: true,
				requiredStatusChecks: [],
			},
		},
	};

	const mockedGraphql = mockGraphQL({
		viewer: { repositories: { nodes: [repoNode], pageInfo: { hasNextPage: false } } },
		rateLimit: { cost: 1, remaining: 4999 },
	});

	const originalRequire = Module.prototype.require;
	Module.prototype.require = function (id) {
		if (id === '@octokit/graphql') {
			return { graphql: mockedGraphql };
		}
		return originalRequire.call(this, id);
	};

	const restore = () => {
		Module.prototype.require = originalRequire;
		delete require.cache[utilsPath];
		delete require.cache[getRepositoriesPath];
	};

	delete require.cache[utilsPath];
	delete require.cache[getRepositoriesPath];
	// eslint-disable-next-line global-require -- must load after the @octokit/graphql mock is installed
	const { getRepositories } = require('../src/getRepositories');

	getRepositories({ token: 'secret', sort: 'name' }).then((result) => {
		t.equal(result.repositories.length, 1, 'returns the fetched repository');
		t.equal(result.repositories[0].nameWithOwner, 'owner/repo', 'data round-trips through the real graphql parse');
		t.equal(result.points.cost, 1, 'captures the rate-limit cost');
		t.equal(result.points.remaining, 4999, 'captures the rate-limit remaining');
		t.equal(
			Metrics.ReqCodeOwnerReviews.extract(result.repositories[0]),
			true,
			'ReqCodeOwnerReviews reflects the fetched branchProtectionRule',
		);
		restore();
		t.end();
	}).catch((e) => {
		restore();
		t.error(e);
		t.end();
	});
});
