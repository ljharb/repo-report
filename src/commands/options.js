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
	'Repository', 'Wiki', 'Projects', 'securityPolicy', 'mergeCommit', 'squashMerge', 'rebaseMerge', 'deleteOnMerge',
];

const mappedFields = [
	(item) => item.nameWithOwner,
	(item) => (item.hasWikiEnabled ? logSymbols.success : logSymbols.error),
	(item) => (item.hasProjectsEnabled ? logSymbols.success : logSymbols.error),
	(item) => (item.isSecurityPolicyEnabled ? logSymbols.success : logSymbols.error),
	(item) => (item.mergeCommitAllowed ? logSymbols.success : logSymbols.error),
	(item) => (item.squashMergeAllowed ? logSymbols.success : logSymbols.error),
	(item) => (item.rebaseMergeAllowed ? logSymbols.success : logSymbols.error),
	(item) => (item.deleteBranchOnMerge ? logSymbols.success : logSymbols.error),
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
	  }

	}
  }
  rateLimit {
	cost
	remaining
  }
}
`;


const optionsList = async (flags) => {
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
	let endCursor,
		hasNextPage,
		points = { cost: 0 },
		repositories = [];

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

module.exports = optionsList;
