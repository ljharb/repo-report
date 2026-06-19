/* eslint-disable no-await-in-loop */
/* eslint-disable no-magic-numbers */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */

'use strict';

const fs = require('fs');
const { graphql } = require('@octokit/graphql');
const Table = require('cli-table');
const { minimatch } = require('minimatch');
const { styleText } = require('util');
const path = require('path');

const symbols = require('./symbols');
const defaultConfig = require('../config/defaults.json');
const validateConfig = require('../config/validate');

let config = {
	...defaultConfig,
};

function isConfigValid(configPaths) {
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
		console.error(styleText('red', `${symbols.error} no config file found, using defaults...`));
	}

	const { valid, error } = validateConfig(config);
	return { error, valid };
}

function dumpCache(cacheDir, date, filename, content) {
	const dateDir = path.join(cacheDir, date);
	fs.mkdirSync(dateDir, { recursive: true });
	fs.writeFileSync(`${dateDir}/${filename}`, content);
}

function listMetrics(metrics) {
	return metrics.map((metric) => metric.name);
}

function sanitizeGlob(glob) {
	return [].concat(glob).map((el) => (el === '*' ? '**' : el));
}

function everyGlobMatch(test, glob) {
	return [].concat(glob).every((pattern) => minimatch(test, pattern));
}

function anyGlobMatch(test, glob) {
	return [].concat(glob).some((pattern) => minimatch(test, pattern));
}

function getCurrMetrics(item) {
	const repoName = item.nameWithOwner;
	const { overrides, metrics } = config;

	return overrides.reduce((acc, rule) => {
		if (anyGlobMatch(repoName, sanitizeGlob(rule.repos))) {
			return {
				...acc,
				...rule.metrics,
			};
		}
		return acc;
	}, metrics);
}

function removeIgnoredRepos(repos, glob) {
	return repos.filter((repo) => !anyGlobMatch(repo.nameWithOwner, glob));
}

function focusRepos(repos, glob) {
	return repos.filter((repo) => everyGlobMatch(repo.nameWithOwner, glob));
}

function getDiffSymbol(
	item,
	allMetrics,
	value,
	metric,
	{ actual, unactionable },
) {
	const configValue = allMetrics[metric.name];
	if (configValue === undefined) {
		return undefined;
	}

	const configIsNull = [].concat(configValue).includes(null);

	let out;
	if (metric.compare) {
		out = metric.compare(item, configValue ?? undefined);
	} else {
		out = typeof value === 'boolean' && configIsNull ? value : configValue === value;
	}
	if (configIsNull) {
		// eslint-disable-next-line eqeqeq
		return actual && out == null ? symbols.ignore : symbols.success;
	}
	const hasEditPermission = !metric.permissions || metric.permissions.includes(item.viewerPermission);
	return `${out || !hasEditPermission ? symbols.success : symbols.error}${hasEditPermission || out || !unactionable ? '' : ` ${symbols.unactionable}`}`;
}

function printAPIPoints(points) {
	console.error(`API Points:
\tused\t\t-\t${points.cost}
\tremaining\t-\t${points.remaining}`);
}

/*
 * Orgs that forbid classic tokens (OAuth App access restrictions / SAML SSO) make GraphQL
 * return errors alongside partial data; salvage that partial data rather than failing outright.
 */
function recoverPartialData(e) {
	if (e.errors && e.data) {
		const orgErrors = e.errors.filter((graphqlError) => graphqlError.message
			&& (
				graphqlError.message.includes('OAuth App access restrictions')
				|| graphqlError.message.includes('personal access token')
				|| graphqlError.message.includes('Resource not accessible')
				|| graphqlError.message.includes('SAML SSO')
			));
		if (orgErrors.length > 0) {
			orgErrors.forEach((graphqlError) => {
				console.error(`${symbols.warning} Skipping due to access restriction: ${graphqlError.message}`);
			});
			return e.data;
		}
	}
	throw e;
}

async function getRepositories(
	generateQuery,
	flags = {},
	{ filter = undefined, perPage = 20 } = {},
) {
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
		let response;
		try {
			response = await graphql(
				generateQuery(endCursor, flags, perPage),
				{
					headers: {
						authorization: `token ${token}`,
					},
				},
			);
		} catch (e) {
			if (e.status === 502 && perPage > 5) {
				// maybe a temporary hack until Github fixes the API implementation of codeOfConduct. or, maybe this is a reasonable "retry" approach to keep?
				return getRepositories(
					generateQuery,
					flags,
					{
						filter,
						perPage: Math.floor(perPage / 10),
					},
				);
			}

			response = recoverPartialData(e);
		}
		const {
			viewer: {
				repositories: { nodes = [], pageInfo = {} } = {},
			} = {},
			rateLimit = {},
		} = response || {};

		({ endCursor, hasNextPage } = pageInfo);
		if (rateLimit.cost) {
			points.cost += rateLimit.cost;
		}
		if (typeof rateLimit.remaining !== 'undefined') {
			points.remaining = rateLimit.remaining;
		}
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
}

function getMetricOut(value, diffValue, { actual, goodness }) {
	if (actual && goodness && diffValue) {
		return `${diffValue} ${value}`;
	}
	if (actual) {
		return `${value}`;
	}
	return `${diffValue || value}`;
}

function collapseCols(rows, metrics) {
	const indexedMetrics = metrics.map((metric, idx) => ({ ...metric, idx }));
	const buckets = {
		0: indexedMetrics,
	};
	const bucketIDMap = Object.fromEntries(indexedMetrics.map((metric) => [metric.name, 0]));
	let nextBucket = 1;

	rows.forEach((row) => {
		Object.keys(buckets).forEach((ID) => {
			const newBucket = [];
			for (let i = 0; i < buckets[ID].length; i++) {
				const metric = buckets[ID][i];

				const valueToCheck = row[metric.idx];
				newBucket.push([metric, valueToCheck]);
			}
			delete buckets[ID];
			const valueBucketIDMap = {};
			newBucket.forEach(([metric, key]) => {
				if (valueBucketIDMap[key]) {
					buckets[valueBucketIDMap[key]].push(metric);
					bucketIDMap[metric.name] = valueBucketIDMap[key];
				} else {
					valueBucketIDMap[key] = nextBucket;
					buckets[nextBucket] = [metric];
					bucketIDMap[metric.name] = nextBucket;
					nextBucket += 1;
				}
			});
		});
	});

	const head = [];
	const dontPrintIDs = {};
	for (let i = 0; i < indexedMetrics.length; i++) {
		const bucket = bucketIDMap[indexedMetrics[i].name];
		if (buckets[bucket]) {
			head.push(buckets[bucket].map((metric) => metric.name).join('\n'));
			delete buckets[bucket];
		} else if (bucket) {
			dontPrintIDs[i] = true;
		}
	}
	const tableRows = rows.map((row) => row.filter((_, idx) => !dontPrintIDs[idx]));
	return { head, tableRows };
}

function collapseRows(rows, key) {
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

	return Object.values(buckets).map((rowIDs) => {
		if (rowIDs.length < 2) {
			return rows[rowIDs[0]];
		}

		const curr = rows[rowIDs[0]];
		for (let i = 1; i < rowIDs.length; i++) {
			const newRow = rows[rowIDs[i]];
			curr[key] = `${curr[key]}\n${newRow[key]}`;
		}
		return curr;
	});
}

function sortRowsByErrors(a, b) {
	const aErrCount = a.join('').split(symbols.error).length;
	const bErrCount = b.join('').split(symbols.error).length;
	return bErrCount - aErrCount;
}

function lineCountReducer(count, row) {
	return count + row[0].split('\n').length;
}

function generateStatsRow(rows) {
	const totalRows = rows.reduce(lineCountReducer, 0);

	return rows[0].map((col, i) => {
		const goodRows = totalRows - rows.filter((row) => row[i] === symbols.error).reduce(lineCountReducer, 0);
		return i === 0 ? 'Stats' : `${Math.round(1e3 * goodRows / totalRows) / 1e1}% (${goodRows}/${totalRows})`;
	});
}

function generateDetailTable(metrics, rowData, {
	unactionable,
	sort,
	actual,
	all,
	goodness,
} = {}) {
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
			const diffValue = goodness && getDiffSymbol(item, currMetrics, value, metric, { actual, unactionable });

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
}

function generateJSONReport(repositories, metricEntries, points) {
	const rows = repositories.map((repo) => {
		const entries = metricEntries.flatMap(([name, metric]) => (
			metric.dontPrint
				? []
				: [[name, metric.extract(repo)]]
		));
		return Object.fromEntries(entries);
	});
	return rows.concat(points);
}

module.exports = {
	dumpCache,
	generateDetailTable,
	generateJSONReport,
	getDiffSymbol,
	getRepositories,
	isConfigValid,
	listMetrics,
	printAPIPoints,
};
