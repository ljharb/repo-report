/* eslint-disable no-await-in-loop */
/* eslint-disable no-magic-numbers */

'use strict';

const { graphql } = require('@octokit/graphql');
const logSymbols = require('log-symbols');
const Table = require('cli-table');

const config = require('../config/config.json');

const listFields = (fields) => fields.map((field) => console.log(`- ${field.name}`));

const getSymbol = (value) => value || false;

const getDiffSymbol = (value) => (value ? logSymbols.success : logSymbols.error);

const checkNull = (value) => value || '---';

const getGroupByField = (group, fields) => {
	let groupByIndex = fields.findIndex((field) => field.name.toLowerCase() === group.toLowerCase());
	if (groupByIndex === -1) {
		console.log(`${logSymbols.error} Invalid Field`);
		return null;
	}
	return fields[groupByIndex];

};

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

const getRepositories = async (generateQuery) => {
	// Repeated requests to get all repositories
	let endCursor,
		hasNextPage,
		points = { cost: 0 },
		repositories = [];

	do {
		const {
			viewer: {
				repositories: { nodes, pageInfo },
			},
			rateLimit,
		} = await graphql(
			generateQuery(endCursor),
			{
				headers: {
					authorization: `token ${process.env.GITHUB_PAT}`,
				},
			},
		);

		endCursor = pageInfo.endCursor;
		hasNextPage = pageInfo.hasNextPage;
		points.cost += rateLimit.cost;
		points.remaining = rateLimit.remaining;
		repositories = repositories.concat(nodes);
	} while (hasNextPage);
	return { points, repositories };
};

// eslint-disable-next-line max-lines-per-function
const generateTable = (fields, rows, {
	groupBy, sort, noCollapse, noDiff, noHide,
} = {}) => {
	let table;
	if (sort) {
		rows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
	}
	if (groupBy) {
		const otherFields = fields.filter((field) => field.name !== groupBy.name);
		table = new Table({
			head: [
				...groupBy.dontPrint ? [] : [groupBy.name],
				...otherFields.filter((field) => !field.dontPrint).map((field) => field.name),
			],
		});
		const groupedObj = {};
		rows.forEach((item) => {
			const key = groupBy.extract(item);
			const value = otherFields.filter((field) => !field.dontPrint).map((field) => field.extract(item));
			if (key in groupedObj) {
				groupedObj[key] = groupedObj[key].map((v, i) => `${v}\n${value[i]}`);
			} else { groupedObj[key] = value; }
		});

		Object.entries(groupedObj).forEach((item) => {
			const [key, value] = item;
			table.push([
				...groupBy.dontPrint ? [] : [key],
				...value,
			]);
		});
	} else {
		let prevRowVals = [];
		let collapseCols = {};
		let tableRows = [];

		const checkCollapse = (idx, nextValue) => {
			if (prevRowVals.length === idx) {
				prevRowVals.push(nextValue);
				collapseCols[idx] = true;
			} else if (prevRowVals[idx] !== nextValue) {
				collapseCols[idx] = false;
			}
		};

		rows.forEach((item) => {
			tableRows.push(fields.filter((field) => !field.dontPrint).map((field, idx) => {
				const key = field.name;
				const value = field.extract(item);

				if (!noDiff && config.metrics[key] !== undefined) {
					let diffValue;
					if (field.compare) {
						diffValue = getDiffSymbol(field.compare(item, config.metrics[key]));
					} else {
						diffValue = getDiffSymbol(config.metrics[key] === value);
					}
					checkCollapse(idx, diffValue);
					return diffValue;
				} else if (!noDiff && !noHide) {
					if (idx !== 0) {
						checkCollapse(idx, value);
						collapseCols[idx] = true;
						return null;
					}
				}
				checkCollapse(idx, value);
				return value;
			}));
		});

		table = new Table({
			head: fields.filter((field, idx) => !field.dontPrint && (noCollapse || !collapseCols[idx]))
				.map((field) => field.name),
		});
		tableRows.map((row) => row.filter((item, idx) => noCollapse || !collapseCols[idx]))
			.forEach((item) => table.push(item));

	}
	return table;
};

module.exports = {
	checkNull,
	generateTable,
	getGroupByField,
	getItemFields,
	getRepositories,
	getSymbol,
	listFields,
	printAPIPoints,
};
