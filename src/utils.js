/* eslint-disable max-lines */
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

const getMetricOut = (value, diffValue, { actual, goodness }) => {
	if (actual && goodness && diffValue) {
		return `${diffValue} ${value}`;
	}
	if (actual) {
		return `${value}`;
	}
	return `${diffValue || value}`;
};

const collapseCols = (rows, metrics) => {
	// eslint-disable-next-line no-param-reassign
	metrics = metrics.map((metric, idx) => ({ ...metric, idx }));
	let buckets = {
		0: metrics,
	};
	let bucketIDMap = {};
	metrics.forEach((metric) => {
		bucketIDMap[metric.name] = 0;
	});
	let nextBucket = 1;

	rows.forEach((row) => {
		for (const ID of Object.keys(buckets)) {
			let newBucket = [];
			for (let i = 0; i < buckets[ID].length; i++) {
				const metric = buckets[ID][i];

				let valueToCheck = row[metric.idx];
				newBucket.push([metric, valueToCheck]);
			}
			delete buckets[ID];
			let valueBucketIDMap = {};
			for (const [metric, key] of newBucket) {
				if (valueBucketIDMap[key]) {
					buckets[valueBucketIDMap[key]].push(metric);
					bucketIDMap[metric.name] = valueBucketIDMap[key];
				} else {
					valueBucketIDMap[key] = nextBucket;
					buckets[nextBucket] = [metric];
					bucketIDMap[metric.name] = nextBucket;
					nextBucket += 1;
				}
			}
		}
	});

	let head = [];
	let dontPrintIDs = {};
	for (let i = 0; i < metrics.length; i++) {
		const bucket = bucketIDMap[metrics[i].name];
		if (buckets[bucket]) {
			head.push(buckets[bucket].map((field) => field.name).join('\n'));
			delete buckets[bucket];
		} else if (bucket) {
			dontPrintIDs[i] = true;
		}
	}
	const tableRows = rows.map((row) => row.filter((_, idx) => !dontPrintIDs[idx]));
	return { head, tableRows };
};

const collapseRows = (rows, key) => {
	const buckets = {};
	for (let i = 0; i < rows.length; i++) {
		let row = [];
		for (let j = 0; j < rows[i].length; j++) {
			if (j !== key) {
				row.push(rows[i][j]);
			}
		}
		const hash = JSON.stringify(row);
		if (buckets[hash]) {
			buckets[hash].push(i);
		} else {
			buckets[hash] = [i];
		}
	}

	let out = [];
	for (const rowIDs of Object.values(buckets)) {
		if (rowIDs.length < 2) {
			out.push(rows[rowIDs[0]]);
		} else {
			let curr = rows[rowIDs[0]];
			for (let i = 1; i < rowIDs.length; i++) {
				const newRow = rows[rowIDs[i]];
				curr[key] = `${curr[key]}\n${newRow[key]}`;
			}
			out.push(curr);
		}
	}
	return out;
};

const generateDetailTable = (fields, rowData, {
	sort,
	actual,
	all,
	goodness,
	pick = [],
} = {}) => {
	if (!rowData.length) {
		console.log(`\n${logSymbols.info} Nothing to show!\n`);
		return null;
	}
	let table;
	if (sort) {
		rowData.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
	}

	const filteredFields = fields.filter((field) => !field.dontPrint);

	if (pick.length > 0) {
		filteredFields.filter((field) => pick.includes(field.name.toLowerCase()));
	}

	const rows = rowData.map((item) => {
		const currMetrics = getCurrMetrics(item);
		return filteredFields.map((field) => {
			const value = field.extract(item);
			const diffValue = getDiffSymbol(item, currMetrics, value, field);

			return getMetricOut(value, diffValue, { actual, goodness });
		});
	});

	if (all) {
		table = new Table({
			head: filteredFields.map((field) => field.name),
		});
		rows.forEach((row) => {
			table.push(row);
		});
	} else {
		let { head, tableRows } = collapseCols(rows, filteredFields);
		tableRows = collapseRows(tableRows, 0);
		table = new Table({
			head,
		});
		tableRows.forEach((row) => {
			table.push(row);
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
