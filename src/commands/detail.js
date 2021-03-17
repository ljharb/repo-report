/* eslint-disable max-lines-per-function */
/* eslint-disable sort-keys */

'use strict';

const {
	listFields,
	printAPIPoints,
	getRepositories,
	generateTable,
	getGroupByField,
	getSymbol,
	checkNull,
} = require('../utils');

const getMergeStrategies = (item) => `${item.mergeCommitAllowed ? 'MERGE' : ''} ${item.squashMergeAllowed ? 'SQUASH' : ''} ${item.rebaseMergeAllowed ? 'REBASE' : ''}`.trim().split(' ').join(',');

// Field names and their extraction method to be used on the query result
const fields = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'IssuesEnabled?', extract: (item) => getSymbol(item.hasIssuesEnabled) },
	{ name: 'ProjectsEnabled?', extract: (item) => getSymbol(item.hasProjectsEnabled) },
	{ name: 'WikiEnabled?', extract: (item) => getSymbol(item.hasWikiEnabled) },
	{ name: 'Archived?', extract: (item) => getSymbol(item.isArchived) },
	{ name: 'BlankIssuesEnabled?', extract: (item) => getSymbol(item.isBlankIssuesEnabled) },
	{ name: 'SecurityPolicyEnabled?', extract: (item) => getSymbol(item.isSecurityPolicyEnabled) },
	{ name: 'License', extract: (item) => item.licenseInfo?.name || '---' },
	{ name: 'Merge Strategies', extract: getMergeStrategies },
	{ name: 'DeleteOnMerge', extract: (item) => getSymbol(item.deleteBranchOnMerge) },
	{ name: 'HasStarred?', extract: (item) => getSymbol(item.viewerHasStarred) },
	{ name: 'Subscription', extract: (item) => item.viewerSubscription },
	{ name: 'DefBranch', extract: (item) => item.defaultBranchRef?.name || '---' },
	{ name: 'AllowsForcePushes', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.allowsForcePushes) },
	{ name: 'AllowsDeletions', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.allowsDeletions) },
	{ name: 'DismissesStaleReviews', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.dismissesStaleReviews) },
	{ name: 'ReqApprovingReviewCount', extract: (item) => checkNull(item.defaultBranchRef?.branchProtectionRule?.requiredApprovingReviewCount) },
	{ name: 'ReqApprovingReviews', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.requiresApprovingReviews) },
	{ name: 'ReqCodeOwnerReviews', extract: (item) => getSymbol(item.defaultBranchRef?.branchProtectionRule?.requiresCodeOwnerReviews) },
];

const generateQuery = (endCursor) => `
query {
  viewer {
	repositories(
	  first: 100
	  affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
	  ${endCursor ? `after: "${endCursor}"` : ''}
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
		isPrivate
		isSecurityPolicyEnabled
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
`;

const detail = async (flags) => {
	// List available fields
	if (flags.f) {
		return listFields(fields);
	}

	// Get index of field to be grouped by
	let groupBy;
	if (flags.g) {
		groupBy = getGroupByField(flags.g, fields);
		if (groupBy === null) {
			return null;
		}
	}

	// Get all repositories
	const { points, repositories } = await getRepositories(generateQuery);

	let table;

	// Generate output table
	table = generateTable(fields, repositories, { sort: flags.s, groupBy });

	console.log(table.toString());

	printAPIPoints(points);
	return null;
};

module.exports = detail;
