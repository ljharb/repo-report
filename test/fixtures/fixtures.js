'use strict';

const Table = require('cli-table');
const symbols = require('../../src/symbols');

const mockRepositoriesData = require('./mockRepositoriesData.json');

const expectedOptions = {
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
};

const tableOutput = Object.setPrototypeOf(Object.assign([
	[
		'Stats',
		'100% (9/9)',
		'33.3% (3/9)',
		'11.1% (1/9)',
		'55.6% (5/9)',
		'11.1% (1/9)',
	],
	[
		'name/challenges-book\nname/responsive-design',
		`${symbols.success}`,
		`${symbols.error}`,
		`${symbols.error}`,
		`${symbols.error}`,
		`${symbols.error}`,
	],
	[
		'name/project-eraser\nname/guidelines-questionnaire\n🔒 name/microservice\nname/media-upload-app',
		`${symbols.success}`,
		`${symbols.error}`,
		`${symbols.error}`,
		`${symbols.success}`,
		`${symbols.error}`,
	],
	[
		'name/tc39-ci',
		`${symbols.success}`,
		`${symbols.success}`,
		`${symbols.error}`,
		`${symbols.error}`,
		`${symbols.success}`,
	],
	[
		'name/ecma262',
		`${symbols.success}`,
		`${symbols.success}`,
		`${symbols.success}`,
		`${symbols.error}`,
		`${symbols.error}`,
	],
	[
		'name/agendas',
		`${symbols.success}`,
		`${symbols.success}`,
		`${symbols.error}`,
		`${symbols.success}`,
		`${symbols.error}`,
	],
], {
	options: {
		...expectedOptions,
		head: ['Repository', 'Access\nCodeOfConduct', 'DefBranch', 'SecurityPolicyEnabled', 'RequiredBranchProtectionSourcePercentage', 'RequireLastPushApproval'],
	},
}), Table.prototype);

const tableOutputActual = Object.setPrototypeOf(Object.assign([
	[
		'name/project-eraser\nname/guidelines-questionnaire\n🔒 name/microservice',
		'ADMIN',
		'master',
		'false',
		'---',
		'100',
		'false',
	],
	[
		'name/challenges-book',
		'ADMIN',
		'master',
		'false',
		'---',
		'40',
		'false',
	],
	[
		'name/responsive-design',
		'ADMIN',
		'master',
		'false',
		'Contributor Covenant',
		'0',
		'false',
	],
	[
		'name/media-upload-app',
		'ADMIN',
		'develop',
		'false',
		'---',
		'100',
		'false',
	],
	[
		'name/tc39-ci',
		'ADMIN',
		'main',
		'false',
		'---',
		'60',
		'true',
	],
	[
		'name/ecma262',
		'ADMIN',
		'main',
		'true',
		'Contributor Covenant',
		'50',
		'false',
	],
	[
		'name/agendas',
		'ADMIN',
		'main',
		'false',
		'---',
		'100',
		'false',
	],
], {
	options: {
		...expectedOptions,
		head: ['Repository', 'Access', 'DefBranch', 'SecurityPolicyEnabled', 'CodeOfConduct', 'RequiredBranchProtectionSourcePercentage', 'RequireLastPushApproval'],
	},
}), Table.prototype);

const tableOutputActualGoodness = Object.setPrototypeOf(Object.assign([
	[
		'name/challenges-book',
		`${symbols.success} ADMIN`,
		`${symbols.error} master`,
		`${symbols.error} false`,
		`${symbols.ignore} ---`,
		`${symbols.error} 40`,
		`${symbols.error} false`,
	],
	[
		'name/responsive-design',
		`${symbols.success} ADMIN`,
		`${symbols.error} master`,
		`${symbols.error} false`,
		`${symbols.success} Contributor Covenant`,
		`${symbols.error} 0`,
		`${symbols.error} false`,
	],
	[
		'name/project-eraser\nname/guidelines-questionnaire\n🔒 name/microservice',
		`${symbols.success} ADMIN`,
		`${symbols.error} master`,
		`${symbols.error} false`,
		`${symbols.ignore} ---`,
		`${symbols.success} 100`,
		`${symbols.error} false`,
	],
	[
		'name/media-upload-app',
		`${symbols.success} ADMIN`,
		`${symbols.error} develop`,
		`${symbols.error} false`,
		`${symbols.ignore} ---`,
		`${symbols.success} 100`,
		`${symbols.error} false`,
	],
	[
		'name/tc39-ci',
		`${symbols.success} ADMIN`,
		`${symbols.success} main`,
		`${symbols.error} false`,
		`${symbols.ignore} ---`,
		`${symbols.error} 60`,
		`${symbols.success} true`,
	],
	[
		'name/ecma262',
		`${symbols.success} ADMIN`,
		`${symbols.success} main`,
		`${symbols.success} true`,
		`${symbols.success} Contributor Covenant`,
		`${symbols.error} 50`,
		`${symbols.error} false`,
	],
	[
		'name/agendas',
		`${symbols.success} ADMIN`,
		`${symbols.success} main`,
		`${symbols.error} false`,
		`${symbols.ignore} ---`,
		`${symbols.success} 100`,
		`${symbols.error} false`,
	],
], {
	options: {
		...expectedOptions,
		head: ['Repository', 'Access', 'DefBranch', 'SecurityPolicyEnabled', 'CodeOfConduct', 'RequiredBranchProtectionSourcePercentage', 'RequireLastPushApproval'],
	},
}), Table.prototype);

const DetailTableColumns = [
	'Repository',
	'Access',
	'IssuesEnabled',
	'ProjectsEnabled',
	'DiscussionsEnabled',
	'WikiEnabled',
	'WebCommitSignoffRequired',
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
	'RequireLastPushApproval',
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
	tableOutputActualGoodness,
	DetailTableColumns,
	sortedRepositories,
	tableData,
	sortedTableData,
};
