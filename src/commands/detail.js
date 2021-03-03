/* eslint-disable sort-keys */

'use strict';

const logSymbols = require('log-symbols');
const {
	listFields,
	printAPIPoints,
	getRepositories,
	generateTable,
	getGroupByField,
	getSymbol,
} = require('../utils');

// Field names and their extraction method to be used on the query result
const fields = [
	{ name: 'Repository', extract: (item) => item.nameWithOwner },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'DefBranch', extract: (item) => (item.defaultBranchRef ? item.defaultBranchRef.name : '---') },
	{ name: 'isPrivate', extract: (item) => getSymbol(item.isPrivate) },
	{ name: 'Wiki', extract: (item) => getSymbol(item.hasWikiEnabled) },
	{ name: 'Projects', extract: (item) => getSymbol(item.hasProjectsEnabled) },
	{ name: 'securityPolicy', extract: (item) => getSymbol(item.isSecurityPolicyEnabled) },
	{ name: 'mergeCommit', extract: (item) => getSymbol(item.mergeCommitAllowed) },
	{ name: 'squashMerge', extract: (item) => getSymbol(item.squashMergeAllowed) },
	{ name: 'rebaseMerge', extract: (item) => getSymbol(item.rebaseMergeAllowed) },
	{ name: 'deleteOnMerge', extract: (item) => getSymbol(item.deleteBranchOnMerge) },
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
        hasWikiEnabled
        hasProjectsEnabled
        isSecurityPolicyEnabled
        mergeCommitAllowed
        squashMergeAllowed
        rebaseMergeAllowed
        deleteBranchOnMerge
		owner {
		  login
		}
		isPrivate
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
		viewerPermission
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
	// Handle Token not found error
	if (!process.env.GITHUB_PAT) {
		console.log(`${logSymbols.error} env variable GITHUB_PAT not found`);
		return null;
	}

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
