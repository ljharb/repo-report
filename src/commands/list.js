/* eslint-disable sort-keys */

'use strict';

const logSymbols = require('log-symbols');
const {
	listFields,
	getGroupByField,
	printAPIPoints,
	getRepositories,
	generateTable,
} = require('../utils');

// Field names and their extraction method to be used on the query result
const fields = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'DefBranch', extract: (item) => item.defaultBranchRef?.name || '---' },
	{
		name: 'isPrivate', extract: (item) => item.isPrivate, dontPrint: true,
	},
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
	table = generateTable(fields, repositories, { groupBy, sort: flags.s });

	console.log(table.toString());

	printAPIPoints(points);
	return null;
};

module.exports = list;
