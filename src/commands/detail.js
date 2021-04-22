/* eslint-disable no-magic-numbers */
/* eslint-disable max-lines-per-function */

'use strict';

const {
	printAPIPoints,
	getRepositories,
	generateDetailTable,
	getGroupByMetric,
} = require('../utils');

const { getMetrics } = require('../metrics');

// Metric names and their extraction method to be used on the query result (Order is preserved)
const metricNames = [
	'Repository',
	'isFork',
	'Access',
	'IssuesEnabled',
	'ProjectsEnabled',
	'WikiEnabled',
	'Archived',
	'BlankIssuesEnabled',
	'SecurityPolicyEnabled',
	'License',
	'MergeStrategies',
	'DeleteOnMerge',
	'HasStarred',
	'Subscription',
	'DefBranch',
	'AllowsForcePushes',
	'AllowsDeletions',
	'DismissesStaleReviews',
	'ReqApprovingReviewCount',
	'ReqApprovingReviews',
	'ReqCodeOwnerReviews',
	'isPrivate',
];

const generateQuery = (endCursor, {
	f,
}) => {
	let showForks = true;
	let showSources = true;
	let showPrivate = true;
	let showPublic = true;
	if (f && f.length) {
		showForks = f.includes('forks');
		showSources = f.includes('sources');
		showPrivate = f.includes('private');
		showPublic = f.includes('public');
	}
	return (
		`query {
  viewer {
	repositories(
	  first: 100
	  affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
	  ${endCursor ? `after: "${endCursor}"` : ''}
	  ${showForks === showSources ? '' : showForks ? 'isFork: true' : 'isFork: false'}
	  ${showPrivate === showPublic ? '' : showPublic ? 'privacy: PUBLIC' : 'privacy: PRIVATE'}
	) {
	  totalCount
	  pageInfo {
		endCursor
		hasNextPage
	}
	nodes {
		name
		nameWithOwner
		defaultBranchRef {
			name
			branchProtectionRule {
				allowsForcePushes
				allowsDeletions
				dismissesStaleReviews
				requiredApprovingReviewCount
				requiresApprovingReviews
				requiresCodeOwnerReviews
				restrictsPushes
			}
		}
		deleteBranchOnMerge
		hasIssuesEnabled
		hasProjectsEnabled
		hasWikiEnabled
		isArchived
		isBlankIssuesEnabled
		isFork
		isPrivate
		isSecurityPolicyEnabled
		isTemplate
		licenseInfo {
			name
		}
		mergeCommitAllowed
		owner {
			login
		}
		rebaseMergeAllowed
		squashMergeAllowed
		createdAt
		updatedAt
		pushedAt
		viewerHasStarred
		viewerPermission
		viewerSubscription
	  }
	}
  }
  rateLimit {
	cost
	remaining
  }
}
`);
};

const detail = async (flags) => {
	let metrics;
	if (flags.p?.length > 0) {
		metrics = getMetrics([
			'Repository',
			'isFork',
			'isPrivate',
			...metricNames.filter((name) => flags.p.includes(name)),
		]);
	} else {
		metrics = getMetrics(metricNames);
	}
	// Get index of metric to be grouped by
	let groupBy;
	if (flags.g) {
		groupBy = getGroupByMetric(flags.g, metrics);
		if (groupBy === null) {
			return null;
		}
	}

	// Additional Filter on repos
	let filter;
	if (flags.f?.includes('templates')) {
		filter = (repo) => repo.isTemplate;
	}

	// Get all repositories
	const { points, repositories } = await getRepositories(generateQuery, flags, filter);

	if (!flags.s) {
		repositories.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
	}

	let table;

	// Generate output table
	table = generateDetailTable(metrics, repositories, {
		actual: flags.actual, all: flags.all, goodness: flags.goodness, sort: flags.s,
	});

	if (table) {
		console.log(table.toString());
	}

	printAPIPoints(points);
	return null;
};

module.exports = detail;
