'use strict';

const symbols = require('../../src/symbols');

// const fixtures = require("@octokit/fixtures");
const mockRepositoriesData = {
	data: {
		viewer: {
			repositories: {
				totalCount: 10,
				pageInfo: {
					endCursor: 'Y3Vtttttc2345642OnYyqrrrrrjhgdg==',
					hasNextPage: false,
				},
				nodes: [
					{
						name: 'project-eraser',
						nameWithOwner: 'name/project-eraser',
						isPrivate: false,
						defaultBranchRef: {
							name: 'master',
						},
						viewerPermission: 'ADMIN',
					},
					{
						name: 'guidelines-questionnaire',
						nameWithOwner: 'name/guidelines-questionnaire',
						isPrivate: false,
						defaultBranchRef: {
							name: 'master',
						},
						viewerPermission: 'ADMIN',
					},
					{
						name: 'challenges-book',
						nameWithOwner: 'name/challenges-book',
						isPrivate: false,
						defaultBranchRef: {
							name: 'master',
						},
						viewerPermission: 'ADMIN',
					},
					{
						name: 'microservice',
						nameWithOwner: 'name/microservice',
						isPrivate: true,
						defaultBranchRef: {
							name: 'master',
						},
						viewerPermission: 'ADMIN',
					},
					{
						name: 'responsive-design',
						nameWithOwner: 'name/responsive-design',
						isPrivate: false,
						defaultBranchRef: {
							name: 'master',
						},
						viewerPermission: 'ADMIN',
					},
					{
						name: 'media-upload-app',
						nameWithOwner: 'name/media-upload-app',
						isPrivate: false,
						defaultBranchRef: {
							name: 'develop',
						},
						viewerPermission: 'ADMIN',
					},
				],
			},
		},
		rateLimit: {
			cost: 1,
			remaining: 4997,
		},
	},
};

const tableOutput = {
	0: [
		'name/project-eraser\nname/guidelines-questionnaire\nname/challenges-book\n🔒 name/microservice\nname/responsive-design\nname/media-upload-app',
		symbols.error,
	],
	options: {
		chars: {
			top: '─',
			'top-mid': '┬',
			'top-left': '┌',
			'top-right': '┐',
			bottom: '─',
			'bottom-mid': '┴',
			'bottom-left': '└',
			'bottom-right': '┘',
			left: '│',
			'left-mid': '├',
			mid: '─',
			'mid-mid': '┼',
			right: '│',
			'right-mid': '┤',
			middle: '│',
		},
		truncate: '…',
		colWidths: [],
		colAligns: [],
		style: {
			'padding-left': 1,
			'padding-right': 1,
			head: ['red'],
			border: ['grey'],
			compact: false,
		},
		head: ['Repository', 'Access\nDefBranch'],
	},
	length: 1,
};

const DetailTableColumns = [
	'Repository',
	'Access',
	'IssuesEnabled',
	'ProjectsEnabled',
	'WikiEnabled',
	'Archived',
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
];

const sortedRepositories = [
	{ name: 'challenges-book',
		nameWithOwner: 'name/challenges-book',
		isPrivate: false,
		defaultBranchRef: { name: 'master' },
		viewerPermission: 'ADMIN' },
	{ name: 'guidelines-questionnaire',
		nameWithOwner: 'name/guidelines-questionnaire',
		isPrivate: false,
		defaultBranchRef: { name: 'master' },
		viewerPermission: 'ADMIN' },
	{ name: 'media-upload-app',
		nameWithOwner: 'name/media-upload-app',
		isPrivate: false,
		defaultBranchRef: { name: 'develop' },
		viewerPermission: 'ADMIN' },
	{ name: 'microservice',
		nameWithOwner: 'name/microservice',
		isPrivate: true, defaultBranchRef: { name: 'master' },
		viewerPermission: 'ADMIN' },
	{ name: 'project-eraser',
		nameWithOwner: 'name/project-eraser',
		isPrivate: false,
		defaultBranchRef: { name: 'master' },
		viewerPermission: 'ADMIN' },
	{ name: 'responsive-design',
		nameWithOwner: 'name/responsive-design',
		isPrivate: false,
		defaultBranchRef: { name: 'master' },
		viewerPermission: 'ADMIN' },
];

const tableData = {
	body: [
		['name/challenges-book', 'ADMIN', 'master'],
		['name/guidelines-questionnaire', 'ADMIN', 'master'],
		['name/media-upload-app', 'ADMIN', 'develop'],
		['🔒 name/microservice', 'ADMIN', 'master'],
		['name/project-eraser', 'ADMIN', 'master'],
		['name/responsive-design', 'ADMIN', 'master'],
	],
	head: ['Repository', 'Access', 'DefBranch'],
};

const sortedTableData = {
	body: [
		['name/challenges-book', 'ADMIN', 'master'],
		['name/guidelines-questionnaire', 'ADMIN', 'master'],
		['name/media-upload-app', 'ADMIN', 'develop'],
		['🔒 name/microservice', 'ADMIN', 'master'],
		['name/project-eraser', 'ADMIN', 'master'],
		['name/responsive-design', 'ADMIN', 'master'],
	],
	head: ['Repository', 'Access', 'DefBranch'],
};
module.exports = {
	mockRepositoriesData,
	tableOutput,
	DetailTableColumns,
	sortedRepositories,
	tableData,
	sortedTableData,
};
