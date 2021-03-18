/* eslint-disable sort-keys */

'use strict';

const logSymbols = require('log-symbols');
const {
	listFields,
	getGroupByField,
	printAPIPoints,
	getRepositories,
	generateTable,
	getSymbol,
	checkNull,
} = require('../utils');

const fields = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
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

const generateQuery = (endCursor) => `
query{
  viewer {
    repositories(last: 100,
    affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
    ${endCursor ? `after: "${endCursor}"` : ''}
      ) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        nameWithOwner
		isPrivate
        defaultBranchRef {
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
      }
    }
  }
  rateLimit {
    cost
    remaining
  }
}


`;

const branchProtection = async (flags) => {
	if (!process.env.GITHUB_PAT) {
		console.log(`${logSymbols.error} env variable GITHUB_PAT not found`);
		return null;
	}
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
	table = generateTable(fields, repositories, { groupBy });

	console.log(table.toString());

	printAPIPoints(points);
	return null;
};

module.exports = branchProtection;
