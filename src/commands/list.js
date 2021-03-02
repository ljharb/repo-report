/* eslint-disable no-magic-numbers */
/* eslint-disable no-await-in-loop */

'use strict';

const { graphql } = require('@octokit/graphql');
const logSymbols = require('log-symbols');

const {
	listFields,
	getGroupIndex,
	generateTable,
	printAPIPoints,
} = require('../utils');

// Field names and their extraction method to be used on the query result
const fields = [
	'Repository',
	'Access',
	'DefBranch',
	'isPublic',
];
const mappedFields = [
	(item) => item.nameWithOwner,
	(item) => item.viewerPermission,
	(item) => (item.defaultBranchRef ? item.defaultBranchRef.name : '---'),
	(item) => (item.isPrivate ? logSymbols.error : logSymbols.success),
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
		groupBy = getGroupIndex(flags.g, fields);
		if (groupBy === -1) {
			console.log(`${logSymbols.error} Invalid Field`);
			return null;
		}
	}

	// Repeated requests to get all repositories

	let endCursor;
	let	hasNextPage;
	let	points = { cost: 0 };
	let	repositories = [];

	do {
		const {
			viewer: {
				repositories: { nodes, pageInfo },
			},
			rateLimit,
		} = await graphql(
			generateQuery(endCursor),
			{
				headers: {
					authorization: `token ${process.env.GITHUB_PAT}`,
				},
			},
		);
		endCursor = pageInfo.endCursor;
		hasNextPage = pageInfo.hasNextPage;
		points.cost += rateLimit.cost;
		points.remaining = rateLimit.remaining;
		repositories = repositories.concat(nodes);
	} while (hasNextPage);

	let table;

	// Generate output table
	if (flags.g) {
		table = generateTable(fields, mappedFields, repositories, groupBy);
	} else {
		table = generateTable(fields, mappedFields, repositories, null, flags.s);
	}

	console.log(table.toString());

	printAPIPoints(points);
	return null;
};

module.exports = list;
