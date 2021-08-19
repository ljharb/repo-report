/* eslint-disable sort-keys */

'use strict';

const { graphql } = require('@octokit/graphql');
const logSymbols = require('log-symbols');
const {
	printAPIPoints,
	generateTable,
} = require('../utils');

const generateQuery = ({
	owner, repo, prId,
}) => `
query {
	repository(owner: "${owner}", name:"${repo}") {
		url
		pullRequest(number: ${prId}){
			merged
			mergeable
			reviewDecision
			commits(last: 1){
			  nodes{
				commit{
				  status {
					state
				  }
				}
			  }
			}
		}
	}
	rateLimit {
		cost
		remaining
	}
}
`;

const isMergeable = (pullRequest) => {
	if (pullRequest.merged) {
		return `${logSymbols.info} Merged`;
	}
	const mergeablilityStatus = pullRequest.mergeable;
	if (mergeablilityStatus === 'MERGEABLE') {
		return logSymbols.success;
	} else {
		return logSymbols.error;
	}
};

const isApproved = (pullRequest) => {
	let reviewDecision = pullRequest.reviewDecision;
	if (reviewDecision === 'APPROVED') {
		return logSymbols.success;
	} else {
		return logSymbols.error;
	}
};

const getBuildInfo = (pullRequest) => {
	const [{ commit: { status } }] = pullRequest.commits.nodes;
	if (status) {
		if (status.state === 'SUCCESS') {
			return logSymbols.success;
		} else {
			return logSymbols.error;
		}
	} else {
		return '---';
	}
};

// Metric names and their extraction method to be used on the query result
const metrics = [
	{ name: 'Mergeable?', extract: isMergeable },
	{ name: 'Approved?', extract:	isApproved },
	{ name: 'Build', extract:	getBuildInfo },
];

const prStatus = async (flags) => {
	try {
		const [owner, ...repo] = flags.repo.split('/');
		const prId = flags.id;
		const { repository: { pullRequest }, rateLimit } = await graphql(
			generateQuery({
				owner, prId, repo: repo.join('/'),
			}),
			{
				headers: {
					authorization: `token ${process.env.GITHUB_PAT}`,
				},
			},
		);
		const table = generateTable(metrics, [pullRequest]);
		console.log(table.toString());
		printAPIPoints(rateLimit);
	} catch (err) {
		console.log(err.errors.map((x) => x.message).join('\n'));
		printAPIPoints(err.data.rateLimit);
	}
};

module.exports = prStatus;
