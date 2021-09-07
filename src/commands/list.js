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
	'Access',
	'DefBranch',
	'isFork',
	'isPrivate',
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
		isFork
		isPrivate
		defaultBranchRef {
			name
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

const list = async (flags) => {
	const metrics = getMetrics(metricNames);
	// List available metrics
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
	const { points, repositories } = await getRepositories(generateQuery, flags);

	// Generate output table
	const table = generateTable(metrics, repositories, { groupBy, sort: flags.s });

	console.log(table.toString());

	printAPIPoints(points);
	return null;
};

module.exports = list;
