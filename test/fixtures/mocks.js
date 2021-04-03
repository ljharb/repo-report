'use strict';

const fetchMock = require('fetch-mock/es5/server');

const { graphql } = require('@octokit/graphql');

/*
 * export const mockGetReviews = ({ businessId, productId, apiKey, limit, sort, response }) => {
 *   const url = `${configModule().apiServer}/businesses/${businessId}/reviews/published?sort=${sort}&client_id=${apiKey}&limit=${limit}${productId ? '&external_unique_id=' + productId : ''}`
 *   fetchMock.get(url, response)
 * }
 */

graphql('{ viewer { login } }', {
	headers: {
		authorization: 'token secret123',
	},
	request: {
		fetch: fetchMock
			.sandbox()
			.post('https://api.github.com/graphql', (url, options) => {
				assert.strictEqual(options.headers.authorization, 'token secret123');
				assert.strictEqual(
					options.body,
					'{"query":"{ viewer { login } }"}',
					'Sends correct query',
				);
				return { data: {} };
			}),
	},
});
