'use strict';

const test = require('tape');
const requireInject = require('require-inject');

test('always fails', async (t) => {
	const getRepositories = requireInject('../src/getRepositories', {
		'@octokit/graphql': {
			async graphql(query, options) {
				throw { query, options };
			},
		},
	});

	try {
		await getRepositories({ token: 'token!' });
		t.fail('should not reach here');
	} catch ({ query, options }) {
		t.equal(typeof query, 'string');
		t.deepEqual(options, { headers: { authorization: 'token token!' } });
	}
});
