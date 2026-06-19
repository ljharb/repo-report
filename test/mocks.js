'use strict';

const { graphql } = require('@octokit/graphql');

module.exports = (data) => graphql.defaults({
	request: {
		fetch: () => Promise.resolve(new Response(JSON.stringify({ data }), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		})),
	},
});
