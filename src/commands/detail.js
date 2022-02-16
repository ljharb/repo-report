/* eslint-disable no-magic-numbers */

'use strict';

const fs = require('fs');

const {
	printAPIPoints,
	getRepositories,
	generateDetailTable,
} = require('../utils');

const { execSync } = require('child_process');
const getMetrics = require('../metrics');
const Metrics = require('../../config/metrics');

// Metric names and their extraction method to be used on the query result (Order is preserved)
const metricNames = Object.keys(Metrics);

function hasFlag(flag, flags, defaultValue = false) {
	return !!(flags?.length > 0 ? flags?.includes(flag) : defaultValue);
}

const generateQuery = (endCursor, { f }) => {
	const showForks = hasFlag('forks', f);
	const showSources = hasFlag('sources', f, true);
	const showPrivate = hasFlag('private', f);
	const showPublic = hasFlag('public', f, true);

	return (
		`query {
  viewer {
	repositories(
	  first: 100
	  affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
	  ${endCursor ? `after: "${endCursor}"` : ''}
	  ${showForks === showSources ? '' : showForks ? 'isFork: true' : 'isFork: false'}
	  ${showPrivate === showPublic ? '' : showPublic ? 'privacy: PUBLIC' : 'privacy: PRIVATE'}
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
			branchProtectionRule {
				allowsForcePushes
				allowsDeletions
				dismissesStaleReviews
				requiredApprovingReviewCount
				requiresApprovingReviews
				requiresCodeOwnerReviews
				requiresConversationResolution
				restrictsPushes
			}
		}
		deleteBranchOnMerge
		hasIssuesEnabled
		hasProjectsEnabled
		hasWikiEnabled
		forkingAllowed
		isArchived
		autoMergeAllowed
		isBlankIssuesEnabled
		isFork
		isPrivate
		isSecurityPolicyEnabled
		isTemplate
		licenseInfo {
			name
		}
		mergeCommitAllowed
		owner {
			login
		}
		rebaseMergeAllowed
		squashMergeAllowed
		createdAt
		updatedAt
		pushedAt
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
`);
};

module.exports = async function detail(flags) {
	const metrics = getMetrics(flags.pick?.length > 0 ? [...new Set([
		'Repository',
		'isFork',
		'isPrivate',
		...metricNames.filter((name) => flags.pick.includes(name)),
	])] : metricNames);

	// Additional Filter on repos
	let filter;
	if (flags.focus?.length === 1 && flags.focus[0] === 'templates') {
		filter = (repo) => repo.isTemplate;
	}

	// Get all repositories
	const { points, repositories } = await getRepositories(generateQuery, flags, filter);

	if (!flags.sort) {
		repositories.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
	}

	const repoOSSF = {};
	repositories.forEach((repository) => {
		const cmd = `scorecard --repo=github.com/${repository.nameWithOwner}| grep Aggregate`;
		const output = execSync(cmd, { encoding: 'utf-8' });
		repoOSSF[repository.nameWithOwner] = output.substring(17).replace('\n', '');
		console.log('Aggregate score for', repository.nameWithOwner, ': ', output.substring(17));
	});

	const json = JSON.stringify(repoOSSF, null, 4);
	fs.writeFile('repoOSSF.json', json, 'utf8', (err) => {
		if (err) {
			return console.error(err);
		}
		return console.log(err);
	});

	// Generate output table
	const table = generateDetailTable(metrics, repositories, {
		actual: flags.actual,
		all: flags.all,
		goodness: flags.goodness,
		sort: flags.sort,
		unactionable: flags.unactionable,
	});

	if (table) {
		console.log(String(table));
	}
	// const output = execSync('scorecard --repo=github.com/${repoURL} | grep Aggregate', { encoding: 'utf-8' });
	printAPIPoints(points);
	return null;
};
