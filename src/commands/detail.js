
'use strict';

const {
	printAPIPoints,
	getRepositories,
	generateDetailTable,
	getGroupByField,
	getSymbol,
	checkNull,
} = require('../utils');

const getMergeStrategies = (item) => `${item.mergeCommitAllowed ? 'MERGE' : ''} ${item.squashMergeAllowed ? 'SQUASH' : ''} ${item.rebaseMergeAllowed ? 'REBASE' : ''}`.trim().split(' ').join(',');

/* eslint-disable */
const cmpMergeStrategies = (item, config) => {
	return (config.MERGE === undefined || config.MERGE === item.mergeCommitAllowed)
		&& (config.SQUASH === undefined || config.SQUASH === item.squashMergeAllowed)
		&& (config.REBASE === undefined || config.REBASE === item.rebaseMergeAllowed);
};
/* eslint-enable */
/* eslint-disable max-lines-per-function */
/* eslint-disable sort-keys */

const cmpAccess = (item, config) => config.includes(item.viewerPermission);
const cmpLicense = (item, config) => config.includes(item.licenseInfo?.name || null);
const cmpSubscription = (item, config) => config.includes(item.viewerSubscription);

// Field names and their extraction method to be used on the query result
const fields = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.isFork ? '🍴 ' : item.isPrivate ? ' ' : ''}${item.nameWithOwner}` },
	{
		name: 'isFork', extract: (item) => item.isFork, dontPrint: true,
	},
	{
		name: 'Access', extract: (item) => item.viewerPermission, compare: cmpAccess,
	},
	{ name: 'IssuesEnabled?', extract: (item) => getSymbol(item.hasIssuesEnabled) },
	{ name: 'ProjectsEnabled?', extract: (item) => getSymbol(item.hasProjectsEnabled) },
	{ name: 'WikiEnabled?', extract: (item) => getSymbol(item.hasWikiEnabled) },
	{ name: 'Archived?', extract: (item) => getSymbol(item.isArchived) },
	{ name: 'BlankIssuesEnabled?', extract: (item) => getSymbol(item.isBlankIssuesEnabled) },
	{ name: 'SecurityPolicyEnabled?', extract: (item) => getSymbol(item.isSecurityPolicyEnabled) },
	{
		name: 'License', extract: (item) => item.licenseInfo?.name || '---', compare: cmpLicense,
	},
	{
		name: 'Merge Strategies', extract: getMergeStrategies, compare: cmpMergeStrategies,
	},
	{ name: 'DeleteOnMerge', extract: (item) => getSymbol(item.deleteBranchOnMerge) },
	{ name: 'HasStarred?', extract: (item) => getSymbol(item.viewerHasStarred) },
	{
		name: 'Subscription', extract: (item) => item.viewerSubscription, compare: cmpSubscription,
	},
	{ name: 'DefBranch', extract: (item) => item.defaultBranchRef?.name || '---' },
	{ name: 'AllowsForcePushes', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.allowsForcePushes) },
	{ name: 'AllowsDeletions', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.allowsDeletions) },
	{ name: 'DismissesStaleReviews', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.dismissesStaleReviews) },
	{ name: 'ReqApprovingReviewCount', extract: (item) => checkNull(item.defaultBranchRef?.branchProtectionRule?.requiredApprovingReviewCount) },
	{ name: 'ReqApprovingReviews', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.requiresApprovingReviews) },
	{ name: 'ReqCodeOwnerReviews', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.requiresCodeOwnerReviews) },
	{
		name: 'isPrivate', extract: (item) => item.isPrivate, dontPrint: true,
	},
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
	// Get index of field to be grouped by
	let groupBy;
	if (flags.g) {
		groupBy = getGroupByField(flags.g, fields);
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

	let table;

	// Generate output table
	table = generateDetailTable(fields, repositories, {
		sort: flags.s, actual: flags.actual, all: flags.all, goodness: flags.goodness,
	});

	if (table) {
		console.log(table.toString());
	}

	printAPIPoints(points);
	return null;
};

module.exports = detail;
