#!/usr/bin/env node

import pargs from 'pargs';
import { styleText } from 'util';
import { homedir } from 'os';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const symbols = require('../src/symbols');
const { isConfigValid } = require('../src/utils');
const Metrics = require('../config/metrics');

const {
	GH_TOKEN,
	GITHUB_TOKEN,
	XDG_CONFIG_HOME,
	XDG_CACHE_DIR,
} = process.env;

const home = homedir();

// Variable to prevent calling isConfigValid twice
const defaultConfigPaths = [].concat(
	XDG_CONFIG_HOME ? join(XDG_CONFIG_HOME, 'repo-report.json') : [],
	join(home, '.repo-report.json'),
);

const cachePath = XDG_CACHE_DIR ? join(XDG_CACHE_DIR, '.repo-report') : join(home, '.repo-report', 'cache');

const focusChoices = ['sources', 'forks', 'templates', 'private', 'public'];
const sortChoices = ['name', 'updated', 'created'];

// Detect command from first positional argument
const [,, commandArg] = process.argv;
const commandName = commandArg === 'ls' || commandArg === 'metrics' ? commandArg : null;

/* eslint array-bracket-newline: off, object-curly-newline: off, sort-keys: off */

const jsonOption = {
	json: { type: 'boolean', default: false, short: 'j' },
};

const repoOptions = {
	focus: { type: 'string', multiple: true, short: 'f' },
	names: { type: 'boolean', default: false },
	sort: { type: 'enum', choices: sortChoices, default: 'updated', short: 's' },
	desc: { type: 'boolean', default: false },
	cache: { type: 'boolean', default: false },
	cacheDir: { type: 'string', default: cachePath },
};

const metricOptions = {
	all: { type: 'boolean', default: false },
	pick: { type: 'string', multiple: true, short: 'p' },
};

// Build options based on command
const options = {
	config: { type: 'string' },
	token: { type: 'string', default: GH_TOKEN || GITHUB_TOKEN },
	version: { type: 'boolean', default: false },
	...jsonOption,
	// repoOptions for ls and default (not metrics)
	...commandName !== 'metrics' && repoOptions,
	// metricOptions for metrics and default (not ls)
	...commandName !== 'ls' && metricOptions,
	// detail-specific options for default command only
	...!commandName && {
		unactionable: { type: 'boolean', default: false },
		actual: { type: 'boolean', default: false },
		goodness: { type: 'boolean', default: true },
		metrics: { type: 'boolean', default: false, short: 'm' },
	},
};

const {
	help,
	values,
	errors,
} = await pargs(import.meta.filename, {
	options,
	allowPositionals: commandName ? 1 : 0,
});

// Handle --version
if (values.version) {
	const pkg = require('../package.json');
	console.log(pkg.version);
	process.exit(0);
}

// Validate config
const configPaths = [].concat(
	values.config ? values.config : [],
	defaultConfigPaths,
);
const { valid, error } = isConfigValid(configPaths);
if (!valid) {
	errors.push(`${symbols.error} ${styleText('red', error)}`);
}

// Validate token
if (!values.token) {
	errors.push(styleText('red', `${symbols.error} env variable GH_TOKEN or GITHUB_TOKEN, or \`--token\` argument, not found.\n\nRefer to #Installation in README.md on how to set an env variable`));
}

// Validate focus choices
if (values.focus) {
	for (const f of values.focus) {
		if (!focusChoices.includes(f)) {
			errors.push(`Invalid focus value: "${f}". Choices: ${focusChoices.join(', ')}`);
		}
	}
}

// Validate pick choices
const metricChoices = Object.keys(Metrics);
if (values.pick) {
	for (const p of values.pick) {
		if (!metricChoices.includes(p)) {
			errors.push(`Invalid pick value: "${p}". Run \`repo-report metrics\` for valid choices.`);
		}
	}
}

// Validate --all and --pick mutual exclusivity
if (values.all && values.pick?.length > 0) {
	errors.push('`--all` and `--pick` are mutually exclusive');
}

// Validate --goodness and --actual (at least one must be set for detail command)
if (!commandName && !values.goodness && !values.actual) {
	errors.push('At least one of `--goodness` and `--actual` must be set.');
}

await help();

// Build flags object matching previous structure
const lsFocus = commandName === 'ls' ? values.focus || focusChoices : values.focus;
const flags = {
	...values,
	f: lsFocus,
	focus: lsFocus,
	s: values.sort,
	p: values.pick,
	m: values.metrics,
	...commandName === 'ls' && { actual: true },
};

// Handle commands
if (commandName === 'ls') {
	const ls = require('../src/commands/ls');

	const {
		points,
		repositories,
	} = await ls(flags);

	if (flags.json) {
		/* eslint function-paren-newline: 0 */
		const report = repositories.map((repo) => Object.fromEntries(
			Object.entries(Metrics).flatMap(([metricName, metric]) => (
				metric.dontPrint
					? []
					: [[metricName, metric.extract(repo)]]
			)),
		)).concat(points);

		console.log(JSON.stringify(report, null, '\t'));
	} else {
		repositories.forEach((repository) => {
			console.log(repository.nameWithOwner);
		});
	}
} else if (commandName === 'metrics') {
	const getMetrics = require('../src/metrics');
	const { listMetrics } = require('../src/utils');

	const metricData = getMetrics(metricChoices);
	const metricNames = listMetrics(metricData);

	if (flags.json) {
		console.log(JSON.stringify(metricNames, null, '\t'));
	} else {
		metricNames.forEach((n) => console.log(`- ${n}`));
	}
} else {
	// Default command: detail
	const detail = require('../src/commands/detail');
	const { printAPIPoints } = require('../src/utils');

	const {
		metrics: detailMetrics,
		points,
		repositories,
		table,
	} = await detail(flags);

	if (flags.json) {
		const report = repositories.map((repo) => Object.fromEntries(
			Object.entries(detailMetrics).flatMap((metric) => (
				metric.dontPrint
					? []
					: [[metric.name, metric.extract(repo)]]
			)),
		)).concat(points);

		console.log(JSON.stringify(report, null, '\t'));
	} else {
		if (table) {
			console.log(String(table));
		}
		printAPIPoints(points);
	}
}
