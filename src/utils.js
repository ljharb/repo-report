'use strict';

const listFields = (fields) => fields.map((item) => console.log(`- ${item}`));

const getGroupIndex = (group, fields) => fields.map((item) => item.toLowerCase()).indexOf(group.toLowerCase());

const printAPIPoints = (points) => {
	console.log(`API Points:
  \tused\t\t-\t${points.cost}
  \tremaining\t-\t${points.remaining}`);
};

const getItemFields = (item) => {
	const nameWithOwner = item.nameWithOwner;
	const defBranch = item.defaultBranchRef ? item.defaultBranchRef.name : '---';
	const { branchProtectionRule } = item.defaultBranchRef || {};
	const {
		allowsForcePushes,
		allowsDeletions,
		dismissesStaleReviews,
		restrictsReviewDismissals,
		requiredApprovingReviewCount,
		requiresApprovingReviews,
		requiresCodeOwnerReviews,
		requiresStatusChecks,
		requiresStrictStatusChecks,
		restrictsPushes,
		pattern,
	} = branchProtectionRule || {};

	return {
		allowsDeletions,
		allowsForcePushes,
		defBranch,
		dismissesStaleReviews,
		nameWithOwner,
		pattern,
		requiredApprovingReviewCount,
		requiresApprovingReviews,
		requiresCodeOwnerReviews,
		requiresStatusChecks,
		requiresStrictStatusChecks,
		restrictsPushes,
		restrictsReviewDismissals,
	};
};

module.exports = {
	getGroupIndex,
	getItemFields,
	listFields,
	printAPIPoints,
};
