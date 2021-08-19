'use strict';

const {
	listMetrics,
	getGroupByMetric,
	printAPIPoints,
	getRepositories,
	generateTable,
} = require('../utils');

const { getMetrics } = require('../metrics');

// Metric names and their extraction method to be used on the query result (Order is preserved)
const metricNames = [
	'Repository',
	'DefBranch',
	'AllowsForcePushes',
	'AllowsDeletions',
	'DismissesStaleReviews',
	'ReqApprovingReviewCount',
	'ReqApprovingReviews',
	'ReqCodeOwnerReviews',
	'isPrivate',
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

const branchProtections = async (flags) => {
	const metrics = getMetrics(metricNames);
	if (flags.m) {
		return listMetrics(metrics);
	}

	// Get index of metric to be grouped by
	let groupBy;
	if (flags.g) {
		groupBy = getGroupByMetric(flags.g, metrics);
		if (groupBy === null) {
			return null;
		}
	}

	// Get all repositories
	const { points, repositories } = await getRepositories(generateQuery);

	let table;

	// Generate output table
	table = generateTable(metrics, repositories, { groupBy });

	console.log(table.toString());

	printAPIPoints(points);
	return null;
};

module.exports = branchProtections;
