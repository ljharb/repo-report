/* eslint-disable no-await-in-loop */
/* eslint-disable no-magic-numbers */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */

'use strict';

/** @import { Config, Flags, Metric, NamedMetric, MetricValue, Points, Repository, ValidationResult } from './types' */

const fs = require('fs');
const { graphql } = require('@octokit/graphql');
const Table = require('cli-table');
const { minimatch } = require('minimatch');
const { styleText } = require('util');
const path = require('path');

const symbols = require('./symbols');
const defaultConfig = require('../config/defaults.json');
const validateConfig = require('../config/validate');

/** @type {Config} */
let config = {
	...defaultConfig,
};

/** @type {(configPaths: string[]) => ValidationResult} */
function isConfigValid(configPaths) {
	/** @type {Config | undefined} */
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

	return validateConfig(config);
}

/** @type {(cacheDir: string, date: string, filename: string, content: string) => void} */
function dumpCache(cacheDir, date, filename, content) {
	const dateDir = path.join(cacheDir, date);
	fs.mkdirSync(dateDir, { recursive: true });
	fs.writeFileSync(`${dateDir}/${filename}`, content);
}

/** @type {(metrics: NamedMetric[]) => string[]} */
function listMetrics(metrics) {
	return metrics.map((metric) => metric.name);
}

/** @type {(glob: string | string[]) => string[]} */
function sanitizeGlob(glob) {
	return /** @type {string[]} */ ([]).concat(glob)
		.map((el) => (el === '*' ? '**' : el));
}

/** @type {(test: string, glob: string | string[]) => boolean} */
function everyGlobMatch(test, glob) {
	return /** @type {string[]} */ ([]).concat(glob)
		.every((pattern) => minimatch(test, pattern));
}

/** @type {(test: string, glob: string | string[]) => boolean} */
function anyGlobMatch(test, glob) {
	return /** @type {string[]} */ ([]).concat(glob)
		.some((pattern) => minimatch(test, pattern));
}

/** @type {(item: Repository) => Record<string, unknown>} */
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

/** @type {(repos: Repository[], glob: string | string[]) => Repository[]} */
function removeIgnoredRepos(repos, glob) {
	return repos.filter((repo) => !anyGlobMatch(repo.nameWithOwner, glob));
}

/** @type {(repos: Repository[], glob: string | string[]) => Repository[]} */
function focusRepos(repos, glob) {
	return repos.filter((repo) => everyGlobMatch(repo.nameWithOwner, glob));
}

/** @type {(item: Repository, allMetrics: Record<string, unknown>, value: MetricValue, metric: NamedMetric, options: { actual?: boolean, unactionable?: boolean }) => string | undefined} */
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

	const configIsNull = /** @type {unknown[]} */ ([]).concat(configValue).includes(null);

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

/** @type {(points: Points) => void} */
function printAPIPoints(points) {
	console.error(`API Points:
\tused\t\t-\t${points.cost}
\tremaining\t-\t${points.remaining}`);
}

/**
 * @typedef {{ message?: string, [key: string]: unknown }} GraphQLError
 * @typedef {{
 *   viewer?: { repositories?: { nodes?: Repository[], pageInfo?: { endCursor?: string, hasNextPage?: boolean } } },
 *   rateLimit?: { cost?: number, remaining?: number }
 * }} GraphQLResponse
 * @typedef {Error & { status?: number, errors?: GraphQLError[], data?: GraphQLResponse }} GraphQLRequestError
 */

/** @type {(e: unknown) => e is GraphQLRequestError} */
const isRequestError = (e) => e instanceof Error;

/*
 * Orgs that forbid classic tokens (OAuth App access restrictions / SAML SSO) make GraphQL
 * return errors alongside partial data; salvage that partial data rather than failing outright.
 */
/** @type {(e: GraphQLRequestError) => GraphQLResponse} */
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

/** @type {(generateQuery: (endCursor: string | undefined, flags: Flags, perPage: number) => string, flags?: Flags, options?: { filter?: (repo: Repository) => boolean, perPage?: number }) => Promise<{ points: Points, repositories: Repository[] }>} */
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
	/** @type {string | undefined} */
	let endCursor;
	/** @type {boolean | undefined} */
	let hasNextPage;
	/** @type {Points} */
	const points = { cost: 0 };
	/** @type {Repository[]} */
	let repositories = [];
	let requestCount = 1;

	do { // Repeated requests to get all repositories
		/** @type {GraphQLResponse | undefined} */
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
			if (!isRequestError(e)) {
				throw e;
			}
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
		if (cache && cacheDir) {
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

	if (cache && cacheDir) {
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

/** @type {(value: MetricValue, diffValue: string | false | undefined, options: { actual?: boolean, goodness?: boolean }) => string} */
function getMetricOut(value, diffValue, { actual, goodness }) {
	if (actual && goodness && diffValue) {
		return `${diffValue} ${value}`;
	}
	if (actual) {
		return `${value}`;
	}
	return `${diffValue || value}`;
}

/** @type {(rows: string[][], metrics: NamedMetric[]) => { head: string[], tableRows: string[][] }} */
function collapseCols(rows, metrics) {
	/** @type {(NamedMetric & { idx: number })[]} */
	const indexedMetrics = metrics.map((metric, idx) => ({ ...metric, idx }));

	/** @type {Record<string, (NamedMetric & { idx: number })[]>} */
	const buckets = {
		0: indexedMetrics,
	};

	const bucketIDMap = Object.fromEntries(indexedMetrics.map((metric) => (
		[metric.name, 0]
	)));
	let nextBucket = 1;

	rows.forEach((row) => {
		Object.keys(buckets).forEach((ID) => {
			/** @type {[NamedMetric & { idx: number }, string][]} */
			const newBucket = [];
			for (let i = 0; i < buckets[ID].length; i++) {
				const metric = buckets[ID][i];

				const valueToCheck = row[metric.idx];
				newBucket.push([metric, valueToCheck]);
			}
			delete buckets[ID];
			/** @type {Record<string, number>} */
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

	/** @type {string[]} */
	const head = [];
	/** @type {Record<number, boolean>} */
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

/** @type {(rows: string[][], key: number) => string[][]} */
function collapseRows(rows, key) {
	/** @type {Record<string, number[]>} */
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

/** @type {(a: string[], b: string[]) => number} */
function sortRowsByErrors(a, b) {
	const aErrCount = a.join('').split(symbols.error).length;
	const bErrCount = b.join('').split(symbols.error).length;
	return bErrCount - aErrCount;
}

/** @type {(count: number, row: string[]) => number} */
function lineCountReducer(count, row) {
	return count + row[0].split('\n').length;
}

/** @type {(rows: string[][]) => string[]} */
function generateStatsRow(rows) {
	const totalRows = rows.reduce(lineCountReducer, 0);

	return rows[0].map((_col, i) => {
		const goodRows = totalRows - rows.filter((row) => row[i] === symbols.error).reduce(lineCountReducer, 0);
		return i === 0 ? 'Stats' : `${Math.round(1e3 * goodRows / totalRows) / 1e1}% (${goodRows}/${totalRows})`;
	});
}

/** @type {(metrics: NamedMetric[], rowData: Repository[], options?: { unactionable?: boolean, sort?: string, actual?: boolean, all?: boolean, goodness?: boolean }) => Table | null} */
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

/**
 * @type {(
 *   repositories: Repository[],
 *   metricEntries: [name: string, metric: Metric][],
 *   points: Points,
 * ) => (Record<string, MetricValue> | Points)[]}
 */
function generateJSONReport(repositories, metricEntries, points) {
	const rows = repositories.map((repo) => {
		/** @type {[string, MetricValue][]} */
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
