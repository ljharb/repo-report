'use strict';

// octokit/fixture, proxy
const assert = require('assert');
const fetchMock = require('fetch-mock/es5/server');
const { graphql } = require('@octokit/graphql');

const mockGetRepositories = (response) => graphql(`{ viewer {
  repositories(
    first: 100
    affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
  ) {
    totalCount
    pageInfo {
    endCursor
    hasNextPage
    }
    nodes {
    name
    nameWithOwner
    isPrivate
    defaultBranchRef {
      name
    }
    viewerPermission
    }
  }
  }
  rateLimit {
  cost
  remaining
  }
} }`, {
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
					`{'query': '{ viewer {
            repositories(
              first: 100
              affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
            ) {
              totalCount
              pageInfo {
              endCursor
              hasNextPage
              }
              nodes {
              name
              nameWithOwner
              isPrivate
              defaultBranchRef {
                name
              }
              viewerPermission
              }
            }
            }
            rateLimit {
            cost
            remaining
            }
          } }'}`,
					'Sends correct query',
				);
				return { data: { response } };
			}),
	},
}).then((result) => result);

/*
 * const mockGetRepositories = (Response) => nock('https://api.github.com')
 *  .post('/graphl')
 *  .reply(201, Response);
 */

module.exports = mockGetRepositories;

