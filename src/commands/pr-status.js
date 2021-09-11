/* eslint-disable sort-keys */

'use strict';

const { graphql } = require('@octokit/graphql');
const symbols = require('../symbols');
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
		return `${symbols.info} Merged`;
	}
	const mergeablilityStatus = pullRequest.mergeable;
	if (mergeablilityStatus === 'MERGEABLE') {
		return symbols.success;
	}
	return symbols.error;

};

const isApproved = (pullRequest) => {
	const { reviewDecision } = pullRequest;
	if (reviewDecision === 'APPROVED') {
		return symbols.success;
	}
	return symbols.error;

};

const getBuildInfo = (pullRequest) => {
	const [{ commit: { status } }] = pullRequest.commits.nodes;
	if (status) {
		if (status.state === 'SUCCESS') {
			return symbols.success;
		}
		return symbols.error;

	}
	return '---';

};

// Metric names and their extraction method to be used on the query result
const metrics = [
	{ name: 'Mergeable?', extract: isMergeable },
	{ name: 'Approved?', extract: isApproved },
	{ name: 'Build', extract: getBuildInfo },
];

module.exports = async function prStatus(flags) {
	const { token } = flags;
	try {
		const [owner, ...repo] = flags.repo.split('/');
		const prId = flags.id;
		const { repository: { pullRequest }, rateLimit } = await graphql(
			generateQuery({
				owner, prId, repo: repo.join('/'),
			}),
			{
				headers: {
					authorization: `token ${token}`,
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
