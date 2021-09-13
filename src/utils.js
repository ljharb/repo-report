/* eslint-disable no-await-in-loop */
/* eslint-disable no-magic-numbers */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */

'use strict';

const fs = require('fs');
const { graphql } = require('@octokit/graphql');
const Table = require('cli-table');
const minimatch = require('minimatch');
const colors = require('colors/safe');

const symbols = require('./symbols');
const defaultConfig = require('../config/defaults.json');
const validateConfig = require('../config/validate');

let config = {
	...defaultConfig,
};

const isConfigValid = (configPaths) => {
	let userConfig;
	for (const currPath of configPaths) {
		try {
			userConfig = JSON.parse(fs.readFileSync(currPath, 'utf8'));
			console.log(`${symbols.info} Config file found at ${currPath}`);
			// eslint-disable-next-line no-restricted-syntax
			break;
		} catch (e) {
			if (e instanceof SyntaxError) {
				return { error: `${symbols.error} Invalid JSON syntax at ${currPath}`, valid: false };
			}
		}
	}
	if (userConfig) {
		config = { ...config, ...userConfig };
	} else {
		console.log(colors.red(`${symbols.error} No config file found`));
		console.log('Using defaults instead...');
	}

	const { valid, error } = validateConfig(config);
	return { error, valid };
};

const dumpCache = (date, filename, content) => {
	const cacheDir = `${__dirname}/../cache`;
	if (!fs.existsSync(cacheDir)) {
		fs.mkdirSync(cacheDir);
	}
	const dateDir = `${__dirname}/../cache/${date}`;
	if (!fs.existsSync(dateDir)) {
		fs.mkdirSync(dateDir);
	}
	fs.writeFileSync(`${dateDir}/${filename}`, content);
};

const listMetrics = (metrics) => metrics.map((metric) => console.log(`- ${metric.name}`));

const getSymbol = (value) => value || false;

const sanitizeGlob = (glob) => [].concat(glob).map((el) => (el === '*' ? '**' : el));

const everyGlobMatch = (test, glob) => [].concat(glob).every((pattern) => minimatch(test, pattern));

const anyGlobMatch = (test, glob) => [].concat(glob).some((pattern) => minimatch(test, pattern));

const getCurrMetrics = (item) => {
	const repoName = item.nameWithOwner;
	const { overrides, metrics } = config;
	let currMetrics = metrics;
	overrides.forEach((rule) => {
		if (anyGlobMatch(repoName, sanitizeGlob(rule.repos))) {
			currMetrics = {
				...currMetrics,
				...rule.metrics,
			};
		}
	});
	return currMetrics;
};

const removeIgnoredRepos = (repos, glob) => repos.filter((repo) => !anyGlobMatch(repo.nameWithOwner, glob));

const focusRepos = (repos, glob) => repos.filter((repo) => everyGlobMatch(repo.nameWithOwner, glob));

// eslint-disable-next-line max-params
const getDiffSymbol = (item, allMetrics, value, metric, { unactionable }) => {
	const configValue = allMetrics[metric.name];
	if (configValue === undefined) {
		return undefined;
	}
	if (configValue === null) {
		return symbols.success;
	}
	let out;
	if (metric.compare) {
		out = metric.compare(item, configValue);
	} else {
		out = configValue === value;
	}
	const hasEditPermission = !metric.permissions || metric.permissions.includes(item.viewerPermission);
	return `${out || !hasEditPermission ? symbols.success : symbols.error}${hasEditPermission || out || !unactionable ? '' : ` ${symbols.unactionable}`}`;
};

const checkNull = (value) => value || '---';

const getGroupByMetric = (group, metrics) => {
	const groupByIndex = metrics.findIndex((metric) => metric.name.toLowerCase() === group.toLowerCase());
	if (groupByIndex === -1) {
		console.log(`${symbols.error} Invalid Metric`);
		return null;
	}
	return metrics[groupByIndex];

};

const printAPIPoints = (points) => {
	console.log(`API Points:
  \tused\t\t-\t${points.cost}
  \tremaining\t-\t${points.remaining}`);
};

const getItemMetrics = (item) => {
	const { nameWithOwner } = item;
	const { branchProtectionRule } = item.defaultBranchRef || {};
	const {
		allowsForcePushes,
		allowsDeletions,
		dismissesStaleReviews,
		requiredApprovingReviewCount,
		requiresApprovingReviews,
		requiresCodeOwnerReviews,
		requiresConversationResolution,
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
		requiresConversationResolution,
	};
};

const getRepositories = async (generateQuery, flags = {}, filter = undefined) => {
	const { cache, token } = flags;

	const date = new Date();
	let endCursor;
	let hasNextPage;
	const points = { cost: 0 };
	let repositories = [];
	let requestCount = 1;

	do { // Repeated requests to get all repositories
		const response = await graphql(
			generateQuery(endCursor, flags),
			{
				headers: {
					authorization: `token ${token}`,
				},
			},
		);
		if (cache) {
			dumpCache(`Response_${(new Date()).toISOString()}.json`, JSON.stringify(response, null, '\t'));
		}
		const {
			viewer: {
				repositories: { nodes, pageInfo },
			},
			rateLimit,
		} = response;

		({ endCursor, hasNextPage } = pageInfo);
		points.cost += rateLimit.cost;
		points.remaining = rateLimit.remaining;
		repositories = repositories.concat(nodes);
		if (cache) {
			dumpCache(date.toISOString(), `response${requestCount > 1 || hasNextPage ? `-${requestCount}` : ''}.json`, JSON.stringify(response, null, '\t'));
		}
		requestCount += 1;
	} while (hasNextPage);

	if (filter) {
		repositories = repositories.filter(filter);
	}

	if (cache) {
		dumpCache(date.toISOString(), 'repos.json', JSON.stringify(repositories, null, '\t'));
	}

	const { repositories: { focus = [], ignore = [] } } = config;
	if (ignore.length > 0) {
		repositories = removeIgnoredRepos(repositories, ignore);
	}
	if (focus.length > 0) {
		repositories = focusRepos(repositories, focus);
	}

	return { points, repositories };
};

const sortRows = (rows) => rows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

// eslint-disable-next-line max-params
const generateTableData = (metrics, rows, groupBy, sort) => {
	let repositories = rows;
	const tableData = { body: [], head: [] };
	if (sort) {
		repositories = sortRows(rows);
	}
	if (groupBy) {
		const otherMetrics = metrics.filter((metric) => metric.name !== groupBy.name);

		tableData.head = [
			...groupBy.dontPrint ? [] : [groupBy.name],
			...otherMetrics.filter((metric) => !metric.dontPrint).map((metric) => metric.name),
		];

		const groupedObj = {};
		repositories.forEach((item) => {
			const key = groupBy.extract(item);
			const value = otherMetrics.filter((metric) => !metric.dontPrint).map((metric) => metric.extract(item));
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
		tableData.head = metrics.filter((metric) => !metric.dontPrint).map((metric) => metric.name);
		repositories.forEach((item) => {
			tableData.body.push(metrics.filter((metric) => !metric.dontPrint).map((metric) => metric.extract(item)));
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

const generateTable = (metrics, rows, { groupBy, sort } = {}) => {
	const data = generateTableData(metrics, rows, groupBy, sort);
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
	const buckets = {
		0: metrics,
	};
	const bucketIDMap = {};
	metrics.forEach((metric) => {
		bucketIDMap[metric.name] = 0;
	});
	let nextBucket = 1;

	rows.forEach((row) => {
		for (const ID of Object.keys(buckets)) {
			const newBucket = [];
			for (let i = 0; i < buckets[ID].length; i++) {
				const metric = buckets[ID][i];

				const valueToCheck = row[metric.idx];
				newBucket.push([metric, valueToCheck]);
			}
			delete buckets[ID];
			const valueBucketIDMap = {};
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

	const head = [];
	const dontPrintIDs = {};
	for (let i = 0; i < metrics.length; i++) {
		const bucket = bucketIDMap[metrics[i].name];
		if (buckets[bucket]) {
			head.push(buckets[bucket].map((metric) => metric.name).join('\n'));
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
		const row = [];
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

	const out = [];
	for (const rowIDs of Object.values(buckets)) {
		if (rowIDs.length < 2) {
			out.push(rows[rowIDs[0]]);
		} else {
			const curr = rows[rowIDs[0]];
			for (let i = 1; i < rowIDs.length; i++) {
				const newRow = rows[rowIDs[i]];
				curr[key] = `${curr[key]}\n${newRow[key]}`;
			}
			out.push(curr);
		}
	}
	return out;
};

const sortRowsByErrors = (a, b) => {
	const aErrCount = a.join('').split(symbols.error).length;
	const bErrCount = b.join('').split(symbols.error).length;
	return bErrCount - aErrCount;
};

const generateDetailTable = (metrics, rowData, {
	unactionable,
	sort,
	actual,
	all,
	goodness,
} = {}) => {
	if (!rowData.length) {
		console.log(`\n${symbols.info} Nothing to show!\n`);
		return null;
	}
	if (sort) {
		rowData.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
	}

	const filteredMetrics = metrics.filter((metric) => !metric.dontPrint);

	const rows = rowData.map((item) => {
		const currMetrics = getCurrMetrics(item);
		return filteredMetrics.map((metric) => {
			const value = metric.extract(item);
			const diffValue = getDiffSymbol(item, currMetrics, value, metric, { unactionable });

			return getMetricOut(value, diffValue, { actual, goodness });
		});
	});

	rows.sort(sortRowsByErrors);

	let table;
	if (all) {
		table = new Table({
			head: filteredMetrics.map((metric) => metric.name),
		});
		rows.forEach((row) => {
			table.push(row);
		});
	} else {
		const { head, tableRows } = collapseCols(rows, filteredMetrics);
		table = new Table({
			head,
		});
		collapseRows(tableRows, 0).forEach((row) => {
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
	getGroupByMetric,
	getItemMetrics,
	getRepositories,
	getSymbol,
	isConfigValid,
	listMetrics,
	printAPIPoints,
	sortRows,
};
