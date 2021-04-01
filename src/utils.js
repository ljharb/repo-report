/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-magic-numbers */

'use strict';

const { graphql } = require('@octokit/graphql');
const logSymbols = require('log-symbols');
const Table = require('cli-table');

const config = require('../config/config.json');

const listFields = (fields) => fields.map((field) => console.log(`- ${field.name}`));

const getSymbol = (value) => value || false;

// eslint-disable-next-line max-params
const getDiffSymbol = (item, configValue, value, compare) => {
	if (configValue === undefined) {
		return undefined;
	}
	let out;
	if (compare) {
		out = compare(item, configValue);
	} else {
		out = configValue === value;
	}
	return out ? logSymbols.success : logSymbols.error;
};

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

const generateTable = (fields, rows, { groupBy, sort } = {}) => {
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
		table = new Table({
			head: fields.filter((field) => !field.dontPrint).map((field) => field.name),
		});
		rows.forEach((item) => {
			table.push(fields.filter((field) => !field.dontPrint).map((field) => field.extract(item)));
		});
	}
	return table;
};

const generateDetailTable = (fields, rows, {
	sort,
	actual,
	all,
	goodness,
} = {}) => {
	let table;
	if (sort) {
		rows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
	}

	const getMetricOut = (value, diffValue) => {
		if (actual && goodness && diffValue) {
			return `${diffValue} ${value}`;
		} else if (actual) {
			return value;
		} else {
			return diffValue || value;
		}
	};

	if (all) {
		table = new Table({
			head: fields.filter((field) => !field.dontPrint).map((field) => field.name),
		});
		rows.forEach((item) => {
			table.push(fields.filter((field) => !field.dontPrint).map((field) => {
				const key = field.name;
				const value = field.extract(item);
				const diffValue = getDiffSymbol(item, config.metrics[key], value, field.compare);

				return getMetricOut(value, diffValue);
			}));
		});
	} else {
		let buckets = {
			0: fields.filter((field) => !field.dontPrint),
		};
		let fieldBucketMap = {};
		fields.filter((field) => !field.dontPrint).forEach((field) => {
			fieldBucketMap[field.name] = 0;
		});
		let nextBucket = 1;

		rows.forEach((item) => {
			for (const bucket of Object.keys(buckets)) {
				let bucketNew = [];
				for (let i = 0; i < buckets[bucket].length; i++) {
					const field = buckets[bucket][i];
					const key = field.name;
					const value = field.extract(item);
					const diffValue = getDiffSymbol(item, config.metrics[key], value, field.compare);

					let valueToCheck = getMetricOut(value, diffValue);
					bucketNew.push([field, valueToCheck]);
				}
				delete buckets[bucket];
				let newBucketMap = {};
				for (const [field, key] of bucketNew) {
					if (newBucketMap[key]) {
						buckets[newBucketMap[key]].push(field);
						fieldBucketMap[field.name] = newBucketMap[key];
					} else {
						newBucketMap[key] = nextBucket;
						buckets[nextBucket] = [field];
						fieldBucketMap[field.name] = nextBucket;
						nextBucket += 1;
					}
				}
			}
		});

		let tableRows = [];
		rows.forEach((item) => {
			tableRows.push(fields.filter((field) => !field.dontPrint).map((field) => {
				const key = field.name;
				const value = field.extract(item);
				const diffValue = getDiffSymbol(item, config.metrics[key], value, field.compare);

				return getMetricOut(value, diffValue);
			}));
		});

		let head = [];
		let dontPrintIDs = {};
		for (let i = 0; i < fields.length; i++) {
			const bucket = fieldBucketMap[fields[i].name];
			if (buckets[bucket]) {
				head.push(buckets[bucket].map((field) => field.name).join('\n'));
				delete buckets[bucket];
			} else {
				dontPrintIDs[i] = true;
			}
		}

		table = new Table({
			head,
		});
		tableRows.forEach((row) => {
			table.push(row.filter((_, idx) => !dontPrintIDs[idx]));
		});

	}
	return table;
};

module.exports = {
	checkNull,
	generateDetailTable,
	generateTable,
	getGroupByField,
	getItemFields,
	getRepositories,
	getSymbol,
	listFields,
	printAPIPoints,
};
