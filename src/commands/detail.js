/* eslint-disable no-magic-numbers */
/* eslint-disable max-lines-per-function */
/* eslint-disable sort-keys */

'use strict';

const logSymbols = require('log-symbols');
const {
	listFields,
	printAPIPoints,
	getRepositories,
	generateTable,
	getGroupByField,
	getSymbol,
} = require('../utils');

// Field names and their extraction method to be used on the query result
const fields = [
	{ name: 'Repository', extract: (item) => item.nameWithOwner },
	{ name: 'DefBranch', extract: (item) => (item.defaultBranchRef ? item.defaultBranchRef.name : '---') },
	{ name: 'Access', extract: (item) => item.viewerPermission },
	{ name: 'Disk Usage', extract: (item) => `${item.diskUsage} KB` },
	{ name: 'IssuesEnabled?', extract: (item) => getSymbol(item.hasIssuesEnabled) },
	{ name: 'ProjectsEnabled?', extract: (item) => getSymbol(item.hasProjectsEnabled) },
	{ name: 'WikiEnabled?', extract: (item) => getSymbol(item.hasWikiEnabled) },
	{ name: 'Archived?', extract: (item) => getSymbol(item.isArchived) },
	{ name: 'BlankIssuesEnabled?', extract: (item) => getSymbol(item.isBlankIssuesEnabled) },
	{ name: 'Repo Disabled?', extract: (item) => getSymbol(item.isDisabled) },
	{ name: 'Repo Empty?', extract: (item) => getSymbol(item.isEmpty) },
	{ name: 'Repo isFork?', extract: (item) => getSymbol(item.isFork) },
	{ name: 'inOrg?', extract: (item) => getSymbol(item.isInOrganization) },
	{ name: 'Locked?', extract: (item) => getSymbol(item.isLocked) },
	{ name: 'Mirror?', extract: (item) => getSymbol(item.isMirror) },
	{ name: 'Private?', extract: (item) => getSymbol(item.isPrivate) },
	{ name: 'SecurityPolicyEnabled?', extract: (item) => getSymbol(item.isSecurityPolicyEnabled) },
	{ name: 'Template?', extract: (item) => getSymbol(item.isTemplate) },
	{ name: 'UserConfigurationRepo?', extract: (item) => getSymbol(item.isUserConfigurationRepository) },
	{ name: 'license', extract: (item) => (item.licenseinfo ? item.licenseinfo.name : '---') },
	{ name: 'mergeCommit', extract: (item) => getSymbol(item.mergeCommitAllowed) },
	{ name: 'squashMerge', extract: (item) => getSymbol(item.squashMergeAllowed) },
	{ name: 'rebaseMerge', extract: (item) => getSymbol(item.rebaseMergeAllowed) },
	{ name: 'deleteOnMerge', extract: (item) => getSymbol(item.deleteBranchOnMerge) },
	{ name: 'stars', extract: (item) => item.stargazerCount },
	{ name: 'CustomOpenGraphImage?', extract: (item) => getSymbol(item.usesCustomOpenGraphImage) },
	{ name: 'canAdmin?', extract: (item) => getSymbol(item.viewerCanAdminister) },
	{ name: 'canCreateProjects?', extract: (item) => getSymbol(item.viewerCanCreateProjects) },
	{ name: 'canSubscribe?', extract: (item) => getSymbol(item.viewerCanSubscribe) },
	{ name: 'canUpdateTopics?', extract: (item) => getSymbol(item.viewerCanUpdateTopics) },
	{ name: 'hasStarred?', extract: (item) => getSymbol(item.viewerHasStarred) },
	{ name: 'Subscription', extract: (item) => item.viewerSubscription },
	{ name: 'createdAt', extract: (item) => item.createdAt.split('T')[0] },
	{ name: 'createdAt', extract: (item) => item.createdAt.split('T')[0] },
	{ name: 'createdAt', extract: (item) => item.createdAt.split('T')[0] },
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
		defaultBranchRef {
			name
		}
		deleteBranchOnMerge
		diskUsage
		hasIssuesEnabled
		hasProjectsEnabled
		hasWikiEnabled
		isArchived
		isArchived
		isBlankIssuesEnabled
		isDisabled
		isEmpty
		isFork
		isInOrganization
		isLocked
		isMirror
		isPrivate
		isPrivate
		isSecurityPolicyEnabled
		isTemplate
		isUserConfigurationRepository
		licenseInfo {
			name
		}
		mergeCommitAllowed
		owner {
			login
		}
		primaryLanguage {
			name
		}
		rebaseMergeAllowed
		squashMergeAllowed
		stargazerCount
		createdAt
		updatedAt
		pushedAt
		usesCustomOpenGraphImage
		viewerCanAdminister
		viewerCanCreateProjects
		viewerCanSubscribe
		viewerCanUpdateTopics
		viewerHasStarred
		viewerPermission
		viewerSubscription
	  }
	}
  }
  rateLimit {
	cost
	remaining
  }
}
`;

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
	table = generateTable(fields, repositories, { sort: flags.s, groupBy });

	console.log(table.toString());

	printAPIPoints(points);
	return null;
};

module.exports = detail;
