/* eslint-disable no-shadow */

'use strict';

const test = require('tape');
const Metrics = require('../config/metrics');

// Execute the tests
test('BlocksDestructivePushes metric - Configuration', (t) => {
	const metric = Metrics.BlocksDestructivePushes;

	t.test('should be properly configured', (t) => {
		t.equal(typeof metric.extract, 'function', 'extract should be a function');
		t.deepEqual(metric.permissions, ['ADMIN'], 'should require ADMIN permissions');
		t.end();
	});
	t.end();
});

test('BlocksDestructivePushes metric - Null cases', (t) => {
	const metric = Metrics.BlocksDestructivePushes;

	t.test('should return null when no branch protection rule exists', (t) => {
		const mockRepo = {
			defaultBranchRef: null,
		};

		const result = metric.extract(mockRepo);
		t.equal(result, null, 'should return null for no defaultBranchRef');

		const mockRepoNoBPR = {
			defaultBranchRef: {
				name: 'main',
				branchProtectionRule: null,
			},
		};

		const result2 = metric.extract(mockRepoNoBPR);
		t.equal(result2, null, 'should return null when branchProtectionRule is null');

		t.end();
	});

	t.test('should handle missing defaultBranchRef', (t) => {
		const mockRepoMissingRef = {};

		const result = metric.extract(mockRepoMissingRef);
		t.equal(result, null, 'should return null when defaultBranchRef is missing entirely');
		t.end();
	});
	t.end();
});

test('BlocksDestructivePushes metric - Blocking cases', (t) => {
	const metric = Metrics.BlocksDestructivePushes;

	t.test('should return true when destructive pushes are blocked', (t) => {
		const mockRepo = {
			defaultBranchRef: {
				name: 'main',
				branchProtectionRule: {
					allowsForcePushes: false,
					allowsDeletions: false,
				},
			},
		};

		const result = metric.extract(mockRepo);
		t.equal(result, true, 'should return true when both force pushes and deletions are disabled');
		t.end();
	});

	t.test('should handle undefined as falsy', (t) => {
		const mockRepo = {
			defaultBranchRef: {
				name: 'main',
				branchProtectionRule: {
					// allowsForcePushes and allowsDeletions are undefined
					requiredStatusChecks: [],
				},
			},
		};

		const result = metric.extract(mockRepo);
		t.equal(result, true, 'should return true when allowsForcePushes and allowsDeletions are undefined (treated as false)');
		t.end();
	});
	t.end();
});

test('BlocksDestructivePushes metric - Allowing cases', (t) => {
	const metric = Metrics.BlocksDestructivePushes;

	t.test('should return false when force pushes are allowed', (t) => {
		const mockRepo = {
			defaultBranchRef: {
				name: 'main',
				branchProtectionRule: {
					allowsForcePushes: true,
					allowsDeletions: false,
				},
			},
		};

		const result = metric.extract(mockRepo);
		t.equal(result, false, 'should return false when force pushes are allowed');
		t.end();
	});

	t.test('should return false when deletions are allowed', (t) => {
		const mockRepo = {
			defaultBranchRef: {
				name: 'main',
				branchProtectionRule: {
					allowsForcePushes: false,
					allowsDeletions: true,
				},
			},
		};

		const result = metric.extract(mockRepo);
		t.equal(result, false, 'should return false when deletions are allowed');
		t.end();
	});

	t.test('should return false when both are allowed', (t) => {
		const mockRepo = {
			defaultBranchRef: {
				name: 'main',
				branchProtectionRule: {
					allowsForcePushes: true,
					allowsDeletions: true,
				},
			},
		};

		const result = metric.extract(mockRepo);
		t.equal(result, false, 'should return false when both force pushes and deletions are allowed');
		t.end();
	});
	t.end();
});
