/* eslint-disable no-await-in-loop */
/* eslint-disable no-magic-numbers */

'use strict';

const { graphql } = require('@octokit/graphql');
const logSymbols = require('log-symbols');
const Table = require('cli-table');
const {
	listFields,
	getGroupIndex,
	printAPIPoints,
	getItemFields,
} = require('../utils');

const fields = [
	'Repository',
	'allowsForcePushes',
	'allowsDeletions',
	'dismissesStaleReviews',
	'reqApprovingReviewCount',
	'reqApprovingReviews',
	'reqCodeOwnerReviews',
	'pattern',
];

const mappedFields = [
	(item) => item.nameWithOwner,
	(item) => (item.allowsForcePushes ? logSymbols.error : logSymbols.success),
	(item) => (item.allowsDeletions ? logSymbols.error : logSymbols.success),
	(item) => (item.dismissesStaleReviews ? logSymbols.error : logSymbols.success),
	(item) => item.requiredApprovingReviewCount || '---',
	(item) => (item.requiresApprovingReviews ? logSymbols.error : logSymbols.success),
	(item) => (item.requiresCodeOwnerReviews ? logSymbols.error : logSymbols.success),
	(item) => item.pattern || '---',
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

const generateTable = (repositories, groupBy) => {
	let table;
	if (groupBy) {
		table = new Table({
			head: [fields[groupBy], 'Repository'],
		});

		const groupedObj = {};
		repositories.forEach((item) => {
			const itemFields = getItemFields(item);
			const key = mappedFields[groupBy](itemFields);

			groupedObj[key] = [].concat(groupedObj[key] || [], itemFields.nameWithOwner);
		});

		Object.entries(groupedObj).forEach(([key, value]) => {
			table.push([key, value.join('\n')]);
		});
	} else {
		table = new Table({
			head: fields,
		});
		repositories.forEach((item) => {
			const itemFields = getItemFields(item);
			table.push(mappedFields.map((func) => func(itemFields)));
		});
	}
	return table;
};

const branchProtection = async (flags) => {
	if (!process.env.GITHUB_PAT) {
		console.log(`${logSymbols.error} env variable GITHUB_PAT not found`);
		return null;
	}
	if (flags.f) {
		return listFields(fields);
	}

	let groupBy;
	if (flags.g) {
		groupBy = getGroupIndex(flags.g, fields);
		if (groupBy === -1) {
			console.log(`${logSymbols.error} Invalid Field`);
			return null;
		}
	}

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
		} = await graphql(generateQuery(endCursor), {
			headers: {
				authorization: `token ${process.env.GITHUB_PAT}`,
			},
		});

		endCursor = pageInfo.endCursor;
		hasNextPage = pageInfo.hasNextPage;
		points.cost += rateLimit.cost;
		points.remaining = rateLimit.remaining;
		repositories = repositories.concat(nodes);
	} while (hasNextPage);

	let table;

	// Generate output table
	if (flags.g) {
		table = generateTable(repositories, groupBy);
	} else {
		table = generateTable(repositories);
	}

	console.log(table.toString());

	printAPIPoints(points);
	return null;
};

module.exports = branchProtection;
