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
	{ name: 'Repository', extract: (item) => item.nameWithOwner },
	{ name: 'allowsForcePushes', extract: (item) => getSymbol(item.allowsForcePushes) },
	{ name: 'allowsDeletions', extract: (item) => getSymbol(item.allowsDeletions) },
	{ name: 'dismissesStaleReviews', extract: (item) => getSymbol(item.dismissesStaleReviews) },
	{ name: 'reqApprovingReviewCount', extract: (item) => checkNull(item.requiredApprovingReviewCount) },
	{ name: 'reqApprovingReviews', extract: (item) => getSymbol(item.requiresApprovingReviews) },
	{ name: 'reqCodeOwnerReviews', extract: (item) => getSymbol(item.requiresCodeOwnerReviews) },
	{ name: 'pattern', extract: (item) => checkNull(item.pattern) },
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
