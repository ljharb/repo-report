
'use strict';

const { mockRepositoriesData } = require('./fixtures/fixtures');
const { stdout } = require('./test-utils');
const test = require('tape');
const Module = require('module');

// test wiill go here
test('test description', (t) => {
	const output = stdout();
	const originalRequire = Module.prototype.require;

	Module.prototype.require = function (id, ...args) {
		if (id === '../getRepositories') {
			return () => Promise.resolve({
				repositories: mockRepositoriesData.data.viewer.repositories.nodes,
			});
		}
		if (id === '../loadingIndicator') {
			return (task) => task();
		}
		return originalRequire.apply(this, [id, ...args]);
	};
	// Dynamic require needed after mock setup to ensure dependencies are mocked
	console.log('1 aabout to import ls module');
	// eslint-disable-next-line global-require
	const ls = require('../src/commands/ls');
	console.log('2 required sucessful, ls is,: ', typeof ls);

	console.log('3. About to call ls function');
	ls({ json: true }).then(() => {
		console.log('4. ls function completed');
		Module.prototype.require = originalRequire;
		// === set up and execution ===
		const obj = JSON.parse(output.loggedData[0]);
		const firstRepo = obj[0];
		console.log(Object.keys(firstRepo));

		// === Stucture Test ===
		t.ok(Array.isArray(obj), 'JSON output should be an array of repositories');
		t.ok(obj.length > 0, 'should have repositories');

		// === Repository Format Test ===
		t.ok(typeof firstRepo?.Repository === 'string', 'repository should be an string');
		t.ok(firstRepo?.Repository.includes('/'), 'repository should be in owner/name format');

		// === Metrics Test ===

		t.ok('Access' in firstRepo, 'Should have an Access field');
		const validAccess = ['ADMIN', 'WRITE', 'READ', 'TRIAGE', 'MAINTAIN'];
		t.ok(validAccess.includes(firstRepo?.Access), 'Access should include a valid permission');
		t.ok('DefBranch' in firstRepo, 'Should have an DefBranch field');
		const validBranch = ['main', 'master', 'develop'];
		t.ok(validBranch.includes(firstRepo?.DefBranch), 'DefBranch should have a valid branch');
		output.restore();
		t.end();
	}).catch(t.error);

});
