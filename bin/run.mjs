#!/usr/bin/env node

import pargs from 'pargs';
import { styleText } from 'util';
import { homedir } from 'os';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const symbols = require('../src/symbols');
const { generateJSONReport, isConfigValid } = require('../src/utils');
const Metrics = require('../config/metrics');

const {
	GH_TOKEN,
	GITHUB_TOKEN,
	XDG_CONFIG_HOME,
	XDG_CACHE_DIR,
} = process.env;

const home = homedir();

// Variable to prevent calling isConfigValid twice
const defaultConfigPaths = /** @type {string[]} */ ([]).concat(
	XDG_CONFIG_HOME ? join(XDG_CONFIG_HOME, 'repo-report.json') : [],
	join(home, '.repo-report.json'),
);

const cachePath = XDG_CACHE_DIR ? join(XDG_CACHE_DIR, '.repo-report') : join(home, '.repo-report', 'cache');

const focusChoices = ['sources', 'forks', 'templates', 'private', 'public'];
const sortChoices = ['name', 'updated', 'created'];

/* eslint array-bracket-newline: off, object-curly-newline: off, sort-keys: off */

const tokenDefault = GH_TOKEN || GITHUB_TOKEN;
// don't print the real token (or a local absolute path) into help output
const tokenDefaultDescription = tokenDefault
	? `${tokenDefault.slice(0, 7)}…${tokenDefault.slice(-4)}`
	: '$GH_TOKEN / $GITHUB_TOKEN';

const commonOptions = /** @type {const} */ ({
	config: { type: 'string', description: 'Path to JSON config file', defaultDescription: '${XDG_CONFIG_HOME:-$HOME}/.repo-report.json' }, // eslint-disable-line no-template-curly-in-string
	token: { type: 'string', default: tokenDefault, defaultDescription: tokenDefaultDescription, description: 'GitHub token (defaults to $GH_TOKEN or $GITHUB_TOKEN)' },
	json: { type: 'boolean', default: false, short: 'j', description: 'Output report in json format' },
});

const repoOptions = /** @type {const} */ ({
	focus: { type: 'string', multiple: true, short: 'f', placeholder: 'type', description: `Focus repo types (${focusChoices.join(', ')})` },
	names: { type: 'boolean', default: false, description: 'Show the list of repo names with their owner' },
	sort: { type: 'enum', choices: sortChoices, default: 'updated', short: 's', description: 'Sort repositories by name, updated, or created date' },
	desc: { type: 'boolean', default: false, description: 'Sort descending, instead of ascending' },
	cache: { type: 'boolean', default: false, description: 'Dump API requests and cleaned-up data in the --cacheDir path' },
	cacheDir: { type: 'string', default: cachePath, defaultDescription: '$XDG_CACHE_DIR/.repo-report, or $HOME/.repo-report/cache', description: 'Cache directory' },
});

const metricOptions = /** @type {const} */ ({
	all: { type: 'boolean', default: false, description: 'Show all metrics' },
	pick: { type: 'string', multiple: true, short: 'p', placeholder: 'metric', description: 'Pick metrics (see `repo-report metrics` for choices)' },
});

const detailOptions = /** @type {const} */ ({
	unactionable: { type: 'boolean', default: false, description: 'Show values of metrics you lack permissions to change, with an unactionable indicator' },
	actual: { type: 'boolean', default: false, description: "Show metrics' true values" },
	goodness: { type: 'boolean', default: true, description: 'Prefix actual values with goodness values' },
	metrics: { type: 'boolean', default: false, short: 'm', description: 'Show available metrics' },
});

const result = await pargs(import.meta.filename, /** @type {const} */ ({
	defaultCommand: 'detail',
	subcommands: {
		detail: {
			description: 'Fetch actionable details about your public, source (non-fork, non-template) repositories; unactionable metrics are converted to a checkmark by default. [default]',
			options: { ...commonOptions, ...repoOptions, ...metricOptions, ...detailOptions },
		},
		ls: {
			description: 'List all repositories (includes sources, forks, templates, and private/public repos by default)',
			options: { ...commonOptions, ...repoOptions },
		},
		metrics: {
			description: 'Show available metrics',
			options: { ...commonOptions, ...metricOptions },
		},
	},
}));

const { command } = result;

const { name: commandName, errors } = command;

// Validate config
const configPaths = /** @type {string[]} */ ([]).concat(
	command.values.config || [],
	defaultConfigPaths,
);
const { valid, error } = isConfigValid(configPaths);
if (!valid) {
	errors.push(`${symbols.error} ${styleText('red', error)}`);
}

// Validate token
if (!command.values.token) {
	errors.push(styleText('red', `${symbols.error} env variable GH_TOKEN or GITHUB_TOKEN, or \`--token\` argument, not found.\n\nRefer to #Installation in README.md on how to set an env variable`));
}

// Validate focus choices
if ('focus' in command.values && command.values.focus) {
	command.values.focus.forEach((f) => {
		if (!focusChoices.includes(f)) {
			errors.push(`Invalid focus value: "${f}". Choices: ${focusChoices.join(', ')}`);
		}
	});
}

// Validate pick choices
const metricChoices = Object.keys(Metrics);
if ('pick' in command.values && command.values.pick) {
	command.values.pick.forEach((p) => {
		if (!metricChoices.includes(p)) {
			errors.push(`Invalid pick value: "${p}". Run \`repo-report metrics\` for valid choices.`);
		}
	});
}

// Validate --all and --pick mutual exclusivity
if ('all' in command.values && command.values.all && (command.values.pick?.length ?? 0) > 0) {
	errors.push('`--all` and `--pick` are mutually exclusive');
}

// Validate --goodness and --actual (at least one must be set for the detail command)
if ('goodness' in command.values && !command.values.goodness && !command.values.actual) {
	errors.push('At least one of `--goodness` and `--actual` must be set.');
}

await result.help();

// Handle commands
if (command.name === 'ls') {
	const { values } = command;
	const focus = values.focus || focusChoices;
	const ls = require('../src/commands/ls');

	const {
		points,
		repositories,
	} = await ls({ ...values, f: focus, focus, actual: true });

	if (values.json) {
		const report = generateJSONReport(repositories, Object.entries(Metrics), points);

		console.log(JSON.stringify(report, null, '\t'));
	} else {
		repositories.forEach((repository) => {
			console.log(repository.nameWithOwner);
		});
	}
} else if (command.name === 'metrics') {
	const getMetrics = require('../src/metrics');
	const { listMetrics } = require('../src/utils');

	const metricData = getMetrics(metricChoices);
	const metricNames = listMetrics(metricData);

	if (command.values.json) {
		console.log(JSON.stringify(metricNames, null, '\t'));
	} else {
		metricNames.forEach((n) => console.log(`- ${n}`));
	}
} else if (command.name === 'detail') {
	const { values } = command;
	const detail = require('../src/commands/detail');
	const { printAPIPoints } = require('../src/utils');

	const {
		metrics: detailMetrics,
		points,
		repositories,
		table,
	} = await detail({ ...values, f: values.focus, focus: values.focus });

	if (values.json) {
		const report = generateJSONReport(
			repositories,
			detailMetrics.map((metric) => [metric.name, metric]),
			points,
		);

		console.log(JSON.stringify(report, null, '\t'));
	} else {
		if (table) {
			console.log(String(table));
		}
		printAPIPoints(points);
	}
} else {
	throw new TypeError(`Unknown command: ${commandName}`);
}
