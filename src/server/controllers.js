/* eslint-disable no-magic-numbers */

'use strict';

const { StatusCodes } = require('http-status-codes');

const parse = require('yargs-parser');
const {
	listMetrics,
	getRepositories,
	generateDetailTable,
	generateGui,
} = require('../utils');

const getMetrics = require('../metrics');

// Metric names and their extraction method to be used on the query result (Order is preserved)
const metricNames = [
	'Repository',
	'isFork',
	'Access',
	'IssuesEnabled',
	'ProjectsEnabled',
	'WikiEnabled',
	'AllowsForking',
	'Archived',
	'AutoMergeAllowed',
	'BlankIssuesEnabled',
	'SecurityPolicyEnabled',
	'License',
	'MergeStrategies',
	'DeleteOnMerge',
	'HasStarred',
	'Subscription',
	'DefBranch',
	'AllowsForcePushes',
	'AllowsDeletions',
	'DismissesStaleReviews',
	'ReqApprovingReviewCount',
	'ReqApprovingReviews',
	'ReqCodeOwnerReviews',
	'ReqConversationResolution',
	'isPrivate',
];

const generateQuery = (endCursor, {
	f,
}) => {
	let showForks = false;
	let showSources = true;
	let showPrivate = false;
	let showPublic = true;
	if (Array.isArray(f)) {
		showForks = f.includes('forks');
		showSources = f.includes('sources');
		showPrivate = f.includes('private');
		showPublic = f.includes('public');
	}
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

/*
 * DOUBT: Copy-Pasted this function here as I was having issues with importing the function
 * from src/commands/detail.js
 */
const detail = async (flags) => {
	if (flags.m) {
		return listMetrics(getMetrics(metricNames));
	}
	let metrics;
	if (flags.p?.length > 0) {
		metrics = getMetrics([
			'Repository',
			'isFork',
			'isPrivate',
			...metricNames.filter((name) => flags.p.includes(name)),
		]);
	} else {
		metrics = getMetrics(metricNames);
	}

	// Additional Filter on repos
	let filter;
	if (flags.f?.length === 1 && flags.f[0] === 'templates') {
		filter = (repo) => repo.isTemplate;
	}
	// Get all repositories
	const { repositories } = await getRepositories(generateQuery, flags, filter);
	if (!flags.s) {
		repositories.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
	}
	// Generate output table
	const table = generateDetailTable(metrics, repositories, {
		actual: flags.actual, all: flags.all, goodness: flags.goodness, sort: flags.s, unactionable: flags.unactionable,
	});

	return table || null;
};

const executeCommand = async (req, res) => {
	const { command } = req.body;
	const argv = parse(command);
	argv.goodness = true;

	if (!argv.token) {
		// token not present, so check positional argument to check if GH_TOKEN or GITHUB_TOKEN is present
		argv._.forEach((element) => {
			const [key, val] = element.split('=');
			if (key === 'GH_TOKEN' || key === 'GITHUB_TOKEN') {
				argv.token = val;
			}
		});
		if (!argv.token) {
			// no token provided in frontend, hence return 403
			return res.status(StatusCodes.FORBIDDEN).json({
				msg: 'env variable GH_TOKEN or GITHUB_TOKEN, or `--token` argument, not found.',
				success: 0,
			});
		}
	}
	let output = await detail(argv);
	output = generateGui(output);
	return res.status(StatusCodes.OK).json({ output });
};

module.exports = {
	executeCommand,
};
