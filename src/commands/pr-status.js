'use strict';

const { graphql } = require('@octokit/graphql');
const logSymbols = require('log-symbols');
const Table = require('cli-table');
const {
	printAPIPoints,
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

// Field names and their extraction method to be used on the query result
const fields = [
	'Mergeable?', 'Approved?', 'Build',
];
const mappedFields = [
	isMergeable, isApproved, getBuildInfo,
];

const generateTable = (data) => {
	let table;
	table = new Table({
		head: fields,
	});
	table.push(mappedFields.map((func) => func(data)));
	return table;
};

const prStatus = async (flags) => {
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
	const table = generateTable(pullRequest);
	console.log(table.toString());
	printAPIPoints(rateLimit);
};

module.exports = prStatus;
