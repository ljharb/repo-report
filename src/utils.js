'use strict';

const listFields = (fields) => fields.map((item) => console.log(`- ${item}`));

const getGroupIndex = (group, fields) => fields.findIndex((item) => item.toLowerCase() === group.toLowerCase());

const printAPIPoints = (points) => {
	console.log(`API Points:
  \tused\t\t-\t${points.cost}
  \tremaining\t-\t${points.remaining}`);
};

const getItemFields = (item) => {
	const nameWithOwner = item.nameWithOwner;
	const { branchProtectionRule } = item.defaultBranchRef || {};
	const {
		allowsForcePushes,
		allowsDeletions,
		dismissesStaleReviews,
		requiredApprovingReviewCount,
		requiresApprovingReviews,
		requiresCodeOwnerReviews,
		pattern,
	} = branchProtectionRule || {};

	return {
		allowsDeletions,
		allowsForcePushes,
		// defBranch,
		dismissesStaleReviews,
		nameWithOwner,
		pattern,
		requiredApprovingReviewCount,
		requiresApprovingReviews,
		requiresCodeOwnerReviews,
	};
};

module.exports = {
	getGroupIndex,
	getItemFields,
	listFields,
	printAPIPoints,
};
