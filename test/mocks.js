/* eslint-disable max-lines-per-function */

'use strict';

const assert = require('assert');
const fetchMock = require('fetch-mock');
const { graphql } = require('@octokit/graphql');

const mockGetRepositories = (response) => graphql(`query {
    viewer {
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
  }`, {
	headers: {
		authorization: 'token secret123',
	},
	request: {
		fetch: fetchMock
			.sandbox()
			.post(
				'https://api.github.com/graphql',
				{ data: response },
				{
					headers: {
						accept: 'application/vnd.github.v3+json',
						authorization: 'token secret123',
					} },
			),
	},
}).then((result) => result);

module.exports = {
	mockGetRepositories,
};
