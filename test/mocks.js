/* eslint-disable max-lines-per-function */

'use strict';

const assert = require('assert');
const nock = require('nock');
const fetchMock = require('fetch-mock');
const { graphql } = require('@octokit/graphql');

/*
 * const mockGetRepositories = (response) => graphql(`query {
 *     viewer {
 *     repositories(
 *       first: 100
 *       affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
 *     ) {
 *       totalCount
 *       pageInfo {
 *       endCursor
 *       hasNextPage
 *       }
 *       nodes {
 *       name
 *       nameWithOwner
 *       isPrivate
 *       defaultBranchRef {
 *         name
 *       }
 *       viewerPermission
 *       }
 *     }
 *     }
 *     rateLimit {
 *     cost
 *     remaining
 *     }
 *   }`, {
 * 	headers: {
 * 		authorization: 'token secret123',
 * 	},
 * 	request: {
 * 		fetch: fetchMock
 * 			.sandbox()
 * 			.post(
 * 				'https://api.github.com/graphql',
 * 				{ data: response },
 * 				{
 * 					headers: {
 * 						accept: 'application/vnd.github.v3+json',
 * 						authorization: 'token secret123',
 * 					} },
 * 			),
 * 	},
 * }).then((result) => result);
 */

const mockGetRepositories = (Response) => nock('https://api.github.com')
	.post('/repos/atom/atom/license')
	.reply(201, Response);
module.exports = {
	mockGetRepositories,
};
