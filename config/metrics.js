'use strict';

/* eslint-disable no-magic-numbers */
/* eslint-disable sort-keys */

const symbols = require('../src/symbols');
const getBPRules = (item) => item.defaultBranchRef?.branchProtectionRule;

const Metrics = {
	Repository: {
		extract: (item) => `${item.isPrivate ? `${symbols.isPrivate} ` : ''}${item.isFork ? `${symbols.fork} ` : item.isPrivate ? ' ' : ''}${item.nameWithOwner}`,
	},
	isFork: {
		extract: (item) => item.isFork,
	},
	Access: {
		extract: (item) => item.viewerPermission,
	},
	IssuesEnabled: {
		extract: (item) => item.hasIssuesEnabled,
		permissions: ['ADMIN', 'MAINTAIN', 'WRITE'],
	},
	ProjectsEnabled: {
		extract: (item) => item.hasProjectsEnabled,
		permissions: ['ADMIN', 'MAINTAIN'],
	},
	WikiEnabled: {
		extract: (item) => item.hasWikiEnabled,
		permissions: ['ADMIN', 'MAINTAIN'],
	},
	AllowsForking: {
		extract: (item) => !item.forkingAllowed,
		permissions: ['ADMIN'],
	},
	Archived: {
		extract: (item) => item.isArchived,
		permissions: ['ADMIN'],
	},
	AutoMergeAllowed: {
		extract: (item) => !item.autoMergeAllowed,
		permissions: ['ADMIN', 'MAINTAIN'],
	},
	BlankIssuesEnabled: {
		extract: (item) => item.isBlankIssuesEnabled,
		permissions: ['ADMIN', 'MAINTAIN', 'WRITE'],
	},
	SecurityPolicyEnabled: {
		extract: (item) => item.isSecurityPolicyEnabled,
		permissions: ['ADMIN', 'MAINTAIN', 'WRITE'],
	},
	License: {
		extract: (item) => item.licenseInfo?.name || '---',
		permissions: ['ADMIN', 'MAINTAIN', 'WRITE'],
	},
	MergeStrategies: {
		extract: (item) => `${item.mergeCommitAllowed ? 'MERGE' : ''} ${item.squashMergeAllowed ? 'SQUASH' : ''} ${item.rebaseMergeAllowed ? 'REBASE' : ''}`.split(' ').filter((strat) => strat).join(','),
		permissions: ['ADMIN', 'MAINTAIN'],
	},
	DeleteOnMerge: {
		extract: (item) => item.deleteBranchOnMerge,
		permissions: ['ADMIN'],
	},
	HasStarred: {
		extract: (item) => item.viewerHasStarred,
		permissions: ['ADMIN', 'MAINTAIN', 'WRITE', 'TRIAGE', 'READ'],
	},
	Subscription: {
		extract: (item) => item.viewerSubscription,
		permissions: ['ADMIN', 'MAINTAIN', 'WRITE', 'TRIAGE', 'READ'],
	},
	DefBranch: {
		extract: (item) => item.defaultBranchRef?.name || '---',
		permissions: ['ADMIN'],
	},
	AllowsForcePushes: {
		extract: (item) => !!getBPRules(item)?.allowsForcePushes,
		permissions: ['ADMIN'],
	},
	AllowsDeletions: {
		extract: (item) => !!getBPRules(item)?.allowsDeletions,
		permissions: ['ADMIN'],
	},
	DismissesStaleReviews: {
		extract: (item) => !!getBPRules(item)?.dismissesStaleReviews,
		permissions: ['ADMIN'],
	},
	ReqApprovingReviewCount: {
		extract: (item) => getBPRules(item)?.requiredApprovingReviewCount || 0,
		permissions: ['ADMIN'],
	},
	ReqApprovingReviews: {
		extract: (item) => !!getBPRules(item)?.requiresApprovingReviews,
		permissions: ['ADMIN'],
	},
	ReqCodeOwnerReviews: {
		extract: (item) => !!getBPRules(item)?.requiresCodeOwnerReview,
		permissions: ['ADMIN'],
	},
	ReqConversationResolution: {
		extract: (item) => !!getBPRules(item)?.requiresConversationResolution,
		permissions: ['ADMIN'],
	},
	isPrivate: {
		extract: (item) => item.isPrivate,
	},
};

module.exports = Metrics;
