/* eslint-disable no-await-in-loop */
/* eslint-disable no-magic-numbers */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */

'use strict';

const fs = require('fs');
const { graphql } = require('@octokit/graphql');
const Table = require('cli-table');
const minimatch = require('minimatch');
const colors = require('colors/safe');
const path = require('path');
const mkdirp = require('mkdirp');

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
			console.error(`${symbols.info} config file found at ${currPath}...`);
			// eslint-disable-next-line no-restricted-syntax
			break;
		} catch (e) {
			if (e instanceof SyntaxError) {
				return { error: `Invalid JSON syntax at ${currPath}`, valid: false };
			}
		}
	}
	if (userConfig) {
		config = {
			metrics: { ...config.metrics, ...userConfig.metrics },
			overrides: userConfig.overrides || [],
			repositories: { ...config.repositories, ...userConfig.repositories },
		};
	} else {
		console.error(colors.red(`${symbols.error} no config file found, using defaults...`));
	}

	const { valid, error } = validateConfig(config);
	return { error, valid };
};

// eslint-disable-next-line max-params
const dumpCache = (cacheDir, date, filename, content) => {
	const dateDir = path.join(cacheDir, date);
	mkdirp.sync(dateDir);
	fs.writeFileSync(`${dateDir}/${filename}`, content);
};

const listMetrics = (metrics) => metrics.forEach((metric) => console.log(`- ${metric.name}`));

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

const printAPIPoints = (points) => {
	console.error(`API Points:
  \tused\t\t-\t${points.cost}
  \tremaining\t-\t${points.remaining}`);
};

const getRepositories = async (generateQuery, flags = {}, filter = undefined) => {
	const {
		cache,
		cacheDir,
		token,
	} = flags;

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
			dumpCache(
				cacheDir,
				date.toISOString(),
				`response${requestCount > 1 || hasNextPage ? `-${requestCount}` : ''}.json`,
				JSON.stringify(response, null, '\t'),
			);
		}
		requestCount += 1;
	} while (hasNextPage);

	if (filter) {
		repositories = repositories.filter(filter);
	}

	if (cache) {
		dumpCache(
			cacheDir,
			date.toISOString(),
			'repos.json',
			JSON.stringify(repositories, null, '\t'),
		);
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

const lineCountReducer = (count, row) => count + row[0].split('\n').length;

const generateStatsRow = (rows) => {
	const totalRows = rows.reduce(lineCountReducer, 0);

	return rows[0].map((col, i) => {
		const goodRows = totalRows - rows.filter((row) => row[i] === symbols.error).reduce(lineCountReducer, 0);
		return i === 0 ? 'Stats' : `${Math.round(1e3 * goodRows / totalRows) / 1e1}% (${goodRows}/${totalRows})`;
	});
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
			const diffValue = goodness && getDiffSymbol(item, currMetrics, value, metric, { unactionable });

			return getMetricOut(value, diffValue, { actual, goodness });
		});
	});

	rows.sort(sortRowsByErrors);

	let table;

	if (all) {
		table = new Table({
			head: filteredMetrics.map((metric) => metric.name),
		});

		if (!actual) {
			table.push(generateStatsRow(rows));
		}

		rows.forEach((row) => {
			table.push(row);
		});
	} else {
		const { head, tableRows } = collapseCols(rows, filteredMetrics);
		table = new Table({
			head,
		});
		const collapsedRows = collapseRows(tableRows, 0);
		if (!actual) {
			table.push(generateStatsRow(collapsedRows));
		}
		collapsedRows.forEach((row) => {
			table.push(row);
		});

	}
	return table;
};

module.exports = {
	dumpCache,
	generateDetailTable,
	getDiffSymbol,
	getRepositories,
	isConfigValid,
	listMetrics,
	printAPIPoints,
};
