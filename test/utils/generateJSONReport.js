'use strict';

/** @import { NamedMetric, Repository } from '../../src/types' */

const test = require('tape');

const { generateJSONReport } = require('../../src/utils');

/** @type {(repo: Partial<Repository>) => Repository} */
const asRepo = (repo) => /** @type {Repository} */ (/** @type {unknown} */ (repo));

test('generateJSONReport', (t) => {
	/** @type {NamedMetric} */
	const Name = { name: 'Name', extract: (repo) => repo.nameWithOwner };
	/** @type {NamedMetric} */
	const isFork = { name: 'isFork', dontPrint: true, extract: (repo) => repo.isFork };

	const repositories = [
		asRepo({ nameWithOwner: 'ljharb/a', isFork: false }),
		asRepo({ nameWithOwner: 'ljharb/b', isFork: true }),
	];
	const points = { cost: 1, remaining: 4999 };

	t.test('keys by metric name, omits dontPrint metrics, and appends points last', (st) => {
		const report = generateJSONReport(repositories, [['Name', Name], ['isFork', isFork]], points);

		st.deepEqual(report, [
			{ Name: 'ljharb/a' },
			{ Name: 'ljharb/b' },
			points,
		], 'one keyed object per repo, with points as the final element');

		st.end();
	});

	t.test('uses the entry name as the key, not the array index (detail `--json` regression)', (st) => {
		const metrics = [Name, isFork];
		const report = generateJSONReport(repositories, metrics.map((metric) => [metric.name, metric]), points);

		st.deepEqual(Object.keys(report[0]), ['Name'], 'the metric name is the key');
		st.notOk('0' in report[0], 'the array index is never used as a key');

		st.end();
	});

	t.end();
});
