'use strict';

const symbols = require('./symbols');

const getMergeStrategies = (item) => `${item.mergeCommitAllowed ? 'MERGE' : ''} ${item.squashMergeAllowed ? 'SQUASH' : ''} ${item.rebaseMergeAllowed ? 'REBASE' : ''}`.split(' ').filter((strat) => strat).join(',');

/* eslint-disable no-magic-numbers */
/* eslint-disable sort-keys */

const cmpAccess = (item, config) => config.includes(item.viewerPermission);
const cmpLicense = (item, config) => config.includes(item.licenseInfo?.name || null);
const cmpSubscription = (item, config) => config.includes(item.viewerSubscription);
const getBPRules = (item) => item.defaultBranchRef?.branchProtectionRule;

const extractMethods = {
	Access: (item) => item.viewerPermission,
	AllowsDeletions: (item) => !!getBPRules(item)?.allowsDeletions,
	AllowsForcePushes: (item) => !!getBPRules(item)?.allowsForcePushes,
	Archived: (item) => item.isArchived,
	BlankIssuesEnabled: (item) => item.isBlankIssuesEnabled,
	DefBranch: (item) => item.defaultBranchRef?.name || '---',
	DeleteOnMerge: (item) => item.deleteBranchOnMerge,
	DismissesStaleReviews: (item) => !!getBPRules(item)?.dismissesStaleReviews,
	HasStarred: (item) => item.viewerHasStarred,
	IssuesEnabled: (item) => item.hasIssuesEnabled,
	License: (item) => item.licenseInfo?.name || '---',
	MergeStrategies: getMergeStrategies,
	ProjectsEnabled: (item) => item.hasProjectsEnabled,
	Repository: (item) => `${item.isPrivate ? `${symbols.isPrivate} ` : ''}${item.isFork ? `${symbols.fork} ` : item.isPrivate ? ' ' : ''}${item.nameWithOwner}`,
	ReqApprovingReviewCount: (item) => getBPRules(item)?.requiredApprovingReviewCount || 0,
	ReqApprovingReviews: (item) => !!getBPRules(item)?.requiresApprovingReviews,
	ReqCodeOwnerReviews: (item) => !!getBPRules(item)?.requiresCodeOwnerReviews,
	ReqConversationResolution: (item) => !!getBPRules(item)?.requiresConversationResolution,
	SecurityPolicyEnabled: (item) => item.isSecurityPolicyEnabled,
	Subscription: (item) => item.viewerSubscription,
	WikiEnabled: (item) => item.hasWikiEnabled,
	isFork: (item) => item.isFork,
	isPrivate: (item) => item.isPrivate,
};

const permissions = {
	AllowsDeletions: ['ADMIN'],
	AllowsForcePushes: ['ADMIN'],
	Archived: ['ADMIN'],
	BlankIssuesEnabled: ['ADMIN', 'MAINTAIN', 'WRITE'],
	DefBranch: ['ADMIN'],
	DeleteOnMerge: ['ADMIN'],
	DismissesStaleReviews: ['ADMIN'],
	HasStarred: ['ADMIN', 'MAINTAIN', 'WRITE', 'TRIAGE', 'READ'],
	IssuesEnabled: ['ADMIN', 'MAINTAIN', 'WRITE'],
	License: ['ADMIN', 'MAINTAIN', 'WRITE'],
	MergeStrategies: ['ADMIN', 'MAINTAIN'],
	ProjectsEnabled: ['ADMIN', 'MAINTAIN'],
	ReqApprovingReviewCount: ['ADMIN'],
	ReqApprovingReviews: ['ADMIN'],
	ReqCodeOwnerReviews: ['ADMIN'],
	ReqConversationResolution: ['ADMIN'],
	SecurityPolicyEnabled: ['ADMIN', 'MAINTAIN', 'WRITE'],
	Subscription: ['WRITE', 'ADMIN', 'MAINTAIN', 'WRITE', 'TRIAGE', 'READ'],
	WikiEnabled: ['ADMIN', 'MAINTAIN'],
};

/* eslint-disable */
const cmpMergeStrategies = (item, config) => {
	return (config.MERGE === undefined || config.MERGE === item.mergeCommitAllowed)
		&& (config.SQUASH === undefined || config.SQUASH === item.squashMergeAllowed)
		&& (config.REBASE === undefined || config.REBASE === item.rebaseMergeAllowed);
};
/* eslint-enable */

const compareMethods = {
	Access: cmpAccess,
	License: cmpLicense,
	MergeStrategies: cmpMergeStrategies,
	Subscription: cmpSubscription,
};

const dontPrint = {
	isFork: true,
	isPrivate: true,
};

const getMetrics = (metrics) => {
	const out = [];
	metrics.forEach((name) => {
		out.push({
			compare: compareMethods[name],
			dontPrint: dontPrint[name],
			extract: extractMethods[name],
			name,
			permissions: permissions[name],
		});
	});
	return out;
};

module.exports = { getMetrics };
