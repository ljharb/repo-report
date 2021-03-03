/* eslint-disable sort-keys */

'use strict';

const logSymbols = require('log-symbols');
const Table = require('cli-table');
const {
	listFields,
	printAPIPoints,
	getRepositories,
} = require('../utils');

// Field names and their extraction method to be used on the query result
const fields = [
	{ name: 'Repository', extract: (item) => item.nameWithOwner },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'DefBranch', extract: (item) => (item.defaultBranchRef ? item.defaultBranchRef.name : '---') },
	{ name: 'isPublic', extract: (item) => (item.isPrivate ? logSymbols.error : logSymbols.success) },
	{ name: 'Wiki', extract: (item) => (item.hasWikiEnabled ? logSymbols.success : logSymbols.error) },
	{ name: 'Projects', extract: (item) => (item.hasProjectsEnabled ? logSymbols.success : logSymbols.error) },
	{ name: 'securityPolicy', extract: (item) => (item.isSecurityPolicyEnabled ? logSymbols.success : logSymbols.error) },
	{ name: 'mergeCommit', extract: (item) => (item.mergeCommitAllowed ? logSymbols.success : logSymbols.error) },
	{ name: 'squashMerge', extract: (item) => (item.squashMergeAllowed ? logSymbols.success : logSymbols.error) },
	{ name: 'rebaseMerge', extract: (item) => (item.rebaseMergeAllowed ? logSymbols.success : logSymbols.error) },
	{ name: 'deleteOnMerge', extract: (item) => (item.deleteBranchOnMerge ? logSymbols.success : logSymbols.error) },
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

const generateTable = (repositories, sort) => {
	let table;

	table = new Table({
		head: fields.map((field) => field.name),
	});

	if (sort) {
		repositories.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
	}

	repositories.forEach((item) => {
		table.push(fields.map((field) => field.extract(item)));
	});
	return table;
};

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

	// Get all repositories
	const { points, repositories } = await getRepositories(generateQuery);

	let table;

	// Generate output table
	table = generateTable(repositories, flags.s);

	console.log(table.toString());

	printAPIPoints(points);
	return null;
};

module.exports = detail;
