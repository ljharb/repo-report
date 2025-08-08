
'use strict';

const { mockRepositoriesData } = require('./fixtures/fixtures');
const { stdout } = require('./test-utils');
const test = require('tape');
const Module = require('module');

test('ls commands', (t) => {
	// test wiill go here
	t.test('test description', async (st) => {
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
		// eslint-disable-next-line global-require
		const ls = require('../src/commands/ls');

		ls({ json: true }).then(() => {
			Module.prototype.require = originalRequire;
			// === set up and execution ===
			const obj = JSON.parse(output.loggedData[0]);
			const firstRepo = obj[0];
			console.log(Object.keys(firstRepo));

			// === Stucture Test ===
			st.ok(Array.isArray(obj), 'JSON output should be an array of repositories');
			st.ok(obj.length > 0, 'should have repositories');

			// === Repository Format Test ===
			st.ok(typeof firstRepo?.repository === 'string', 'repository should be an string');
			st.ok(firstRepo?.repository.includes('/'), 'repository should be in owner/name format');

			// === Metrics Test ===

			st.ok('Access' in firstRepo, 'Should have an Access field');
			const validAccess = ['ADMIN', 'WRITE', 'READ', 'TRIAGE', 'MAINTAIN'];
			st.ok(validAccess.includes(firstRepo?.Access), 'Access should include a valid permission');
			st.ok('DefBranch' in firstRepo, 'Should have an DefBranch field');
			const validBranch = ['main', 'master', 'develop'];
			st.ok(validBranch.includes(firstRepo?.DefBranch), 'DefBranch should have a valid branch');
			output.restore();
			st.end();
		}).catch(st.error);
	});
});
