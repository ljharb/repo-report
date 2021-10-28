'use strict';

const Table = require('cli-table');
const symbols = require('../../src/symbols');

const mockRepositoriesData = require('./mockRepositoriesData.json');

const tableOutput = {
	__proto__: Table.prototype,
	0: ['Stats', '0% (0/6)'],
	1: [
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
	length: 2,
};

const tableOutputActual = {
	__proto__: Table.prototype,
	0: ['name/project-eraser\nname/guidelines-questionnaire\nname/challenges-book\n🔒 name/microservice\nname/responsive-design', 'ADMIN', 'master'],
	1: ['name/media-upload-app', 'ADMIN', 'develop'],
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
		head: ['Repository', 'Access', 'DefBranch'],
	},
	length: 2,
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

const sortedRepositories = require('./sortedRepositories.json');

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
	tableOutputActual,
	DetailTableColumns,
	sortedRepositories,
	tableData,
	sortedTableData,
};
