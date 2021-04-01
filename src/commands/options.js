/* eslint-disable sort-keys */

'use strict';

const {
	listFields,
	getGroupByField,
	printAPIPoints,
	getRepositories,
	generateTable,
	getSymbol,
} = require('../utils');

// Field names and their extraction method to be used on the query result
const fields = [
	{ name: 'Repository', extract: (item) => `${item.isPrivate ? '🔒 ' : ''}${item.nameWithOwner}` },
	{ name: 'Wiki', extract: (item) => getSymbol(item.hasWikiEnabled) },
	{ name: 'Projects', extract: (item) => getSymbol(item.hasProjectsEnabled) },
	{ name: 'securityPolicy', extract: (item) => getSymbol(item.isSecurityPolicyEnabled) },
	{ name: 'mergeCommit', extract: (item) => getSymbol(item.mergeCommitAllowed) },
	{ name: 'squashMerge', extract: (item) => getSymbol(item.squashMergeAllowed) },
	{ name: 'rebaseMerge', extract: (item) => getSymbol(item.rebaseMergeAllowed) },
	{ name: 'deleteOnMerge', extract: (item) => getSymbol(item.deleteBranchOnMerge) },
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

module.exports = optionsList;
