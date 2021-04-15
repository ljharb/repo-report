/* eslint-disable max-lines-per-function */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-magic-numbers */

'use strict';

const fs = require('fs');
const { graphql } = require('@octokit/graphql');
const logSymbols = require('log-symbols');
const Table = require('cli-table');
const minimatch = require('minimatch');

const config = require('../config/config.json');

const dumpCache = (filename, content) => {
	const dir = `${__dirname}/../cache`;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	console.log(dir);
	fs.writeFileSync(`${dir}/${filename}`, content);
};

const listFields = (fields) => fields.map((field) => console.log(`- ${field.name}`));

const getSymbol = (value) => value || false;

const getCurrMetrics = (item) => {
	const repoName = item.nameWithOwner;
	const { overrides, metrics } = config;
	let currMetrics = metrics;
	overrides.forEach((rule) => {
		let shouldApply = false;
		rule.repos.forEach((repoGlob) => {
			if (minimatch(repoName, repoGlob)) {
				shouldApply = true;
			}
		});
		if (shouldApply) {
			currMetrics = {
				...currMetrics,
				...rule.metrics,
			};
		}
	});
	return currMetrics;
};

const removeIgnoredRepos = (repos) => repos.filter((repo) => {
	const repoName = repo.nameWithOwner;
	const { repositories: { ignore } } = config;
	let include = true;
	ignore.forEach((glob) => {
		if (minimatch(repoName, glob)) {
			include = false;
		}
	});
	return include;
});

// eslint-disable-next-line max-params
const getDiffSymbol = (item, currMetrics, value, field) => {
	const configValue = currMetrics[field.name];
	if (configValue === undefined) {
		return undefined;
	}
	if (configValue === null) {
		return logSymbols.success;
	}
	let out;
	if (field.compare) {
		out = field.compare(item, configValue);
	} else {
		out = configValue === value;
	}
	return `${out ? logSymbols.success : logSymbols.error}${field.permissions && !field.permissions.includes(item.viewerPermission) && !out ? ' 🤷' : ''}`;
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
		dismissesStaleReviews,
		nameWithOwner,
		pattern,
		requiredApprovingReviewCount,
		requiresApprovingReviews,
		requiresCodeOwnerReviews,
	};
};

const getRepositories = async (generateQuery, flags, filter) => {
	// Repeated requests to get all repositories
	let endCursor,
		hasNextPage,
		points = { cost: 0 },
		repositories = [];

	do {
		const response = await graphql(
			generateQuery(endCursor, flags),
			{
				headers: {
					authorization: `token ${process.env.GITHUB_PAT}`,
				},
			},
		);
		if (flags.cache) {
			dumpCache(`Response_${(new Date()).toISOString()}.json`, JSON.stringify(response, null, '\t'));
		}
		const {
			viewer: {
				repositories: { nodes, pageInfo },
			},
			rateLimit,
		} = response;

		endCursor = pageInfo.endCursor;
		hasNextPage = pageInfo.hasNextPage;
		points.cost += rateLimit.cost;
		points.remaining = rateLimit.remaining;
		repositories = repositories.concat(nodes);
	} while (hasNextPage);
	if (filter) {
		repositories = repositories.filter(filter);
	}
	if (flags.cache) {
		dumpCache(`Repositories_${(new Date()).toISOString()}.json`, JSON.stringify(repositories, null, '\t'));
	}
	repositories = removeIgnoredRepos(repositories);
	return { points, repositories };
};

const sortRows = (rows) => rows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

// eslint-disable-next-line max-params
const generateTableData = (fields, rows, groupBy, sort) => {
	let repositories = rows;
	let tableData	= { body: [], head: [] };
	if (sort) {
		repositories =	sortRows(rows);
	}
	if (groupBy) {
		const otherFields = fields.filter((field) => field.name !== groupBy.name);

		tableData.head = [
			...groupBy.dontPrint ? [] : [groupBy.name],
			...otherFields.filter((field) => !field.dontPrint).map((field) => field.name),
		];

		const groupedObj = {};
		repositories.forEach((item) => {
			const key = groupBy.extract(item);
			const value = otherFields.filter((field) => !field.dontPrint).map((field) => field.extract(item));
			if (key in groupedObj) {
				groupedObj[key] = groupedObj[key].map((v, i) => `${v}\n${value[i]}`);
			} else { groupedObj[key] = value; }
		});

		Object.entries(groupedObj).forEach((item) => {
			const [key, value] = item;
			tableData.body.push([
				...groupBy.dontPrint ? [] : [key],
				...value,
			]);
		});
	} else {

		tableData.head = fields.filter((field) => !field.dontPrint).map((field) => field.name);
		repositories.forEach((item) => {
			tableData.body.push(fields.filter((field) => !field.dontPrint).map((field) => field.extract(item)));
		});
	}
	return tableData;

};

const createTable = (tableData) => {
	const table = new Table({ head: tableData.head });
	tableData.body.forEach((item) => {
		table.push(item);
	});
	return table;
};

const generateTable = (fields, rows, { groupBy, sort } = {}) => {
	const data = generateTableData(fields, rows, groupBy, sort);
	return createTable(data);
};

const generateDetailTable = (fields, rows, {
	sort,
	actual,
	all,
	goodness,
} = {}) => {
	if (!rows.length) {
		console.log(`\n${logSymbols.info} Nothing to show!\n`);
		return null;
	}
	let table;
	if (sort) {
		rows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
	}

	const getMetricOut = (value, diffValue) => {
		if (actual && goodness && diffValue) {
			return `${diffValue} ${value}`;
		}
		if (actual) {
			return `${value}`;
		}
		return `${diffValue || value}`;
	};

	const filteredFields = fields.filter((field) => !field.dontPrint);

	if (all) {
		table = new Table({
			head: filteredFields.map((field) => field.name),
		});
		rows.forEach((item) => {
			const currMetrics = getCurrMetrics(item);
			table.push(filteredFields.map((field) => {
				const value = field.extract(item);
				const diffValue = getDiffSymbol(item, currMetrics, value, field);

				return getMetricOut(value, diffValue);
			}));
		});
	} else {
		let buckets = {
			0: filteredFields,
		};
		let fieldBucketMap = {};
		filteredFields.forEach((field) => {
			fieldBucketMap[field.name] = 0;
		});
		let nextBucket = 1;

		rows.forEach((item) => {
			const currMetrics = getCurrMetrics(item);
			for (const bucket of Object.keys(buckets)) {
				let bucketNew = [];
				for (let i = 0; i < buckets[bucket].length; i++) {
					const field = buckets[bucket][i];
					const value = field.extract(item);
					const diffValue = getDiffSymbol(item, currMetrics, value, field);

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
			const currMetrics = getCurrMetrics(item);
			tableRows.push(filteredFields.map((field) => {
				const value = field.extract(item);
				const diffValue = getDiffSymbol(item, currMetrics, value, field);

				return getMetricOut(value, diffValue);
			}));
		});

		let head = [];
		let dontPrintIDs = {};
		for (let i = 0; i < filteredFields.length; i++) {
			const bucket = fieldBucketMap[filteredFields[i].name];
			if (buckets[bucket]) {
				head.push(buckets[bucket].map((field) => field.name).join('\n'));
				delete buckets[bucket];
			} else if (bucket) {
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
	createTable,
	dumpCache,
	generateDetailTable,
	generateTable,
	generateTableData,
	getDiffSymbol,
	getGroupByField,
	getItemFields,
	getRepositories,
	getSymbol,
	listFields,
	printAPIPoints,
	sortRows,
};
