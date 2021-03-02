'use strict';
const Table = require('cli-table');
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

const generateTable = (fields, mappedFields, repositories, groupBy, sort) => {
	let table;
	if (groupBy) {
		table = new Table({
			head: [fields[groupBy], 'Repository'],
		});
		const groupedObj = {};
		repositories.forEach((item) => {
			const key = mappedFields[groupBy](item);
			if (key in groupedObj) {
				groupedObj[key].push(item.nameWithOwner);
			} else { groupedObj[key] = [item.nameWithOwner]; }
		});

		Object.entries(groupedObj).forEach((item) => {
			const [key, value] = item;
			table.push([key, value.join('\n')]);
		});
	} else {

		table = new Table({
			head: fields,
		});

		if (sort) {
			repositories.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
		}

		repositories.forEach((item) => {
			table.push(mappedFields.map((func) => func(item)));
		});

	}
	return table;
};

module.exports = {
	getGroupIndex,
	getItemFields,
	generateTable,
	listFields,
	printAPIPoints,
};
