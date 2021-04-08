/* eslint-disable no-magic-numbers */

'use strict';

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
const Validator = require('jsonschema').Validator;

const schemaValidator = new Validator();

const metricSchema = {
	id: '/metrics',
	properties: {
		Access: {
			'enum': [
				'WRITE', 'ADMIN', 'MAINTAIN', 'TRIAGE', 'READ',
			],
			type: 'string',
		},
		AllowsDeletions: { type: 'boolean' },
		AllowsForcePushes: { type: 'boolean' },
		'Archived?': { type: 'boolean' },
		'BlankIssuesEnabled?': { type: 'boolean' },
		DefBranch: { type: 'string' },
		DeleteOnMerge: { type: 'boolean' },
		DismissesStaleReviews: { type: 'boolean' },
		'HasStarred?': { type: 'boolean' },
		'IssuesEnabled?': { type: 'boolean' },
		License: {
			'enum': [
				'MIT License',
				'Apache License 2.0',
				'BSD 3-Clause "New" or "Revised" license',
				'BSD 2-Clause "Simplified" or "FreeBSD" license',
				'GNU General Public License (GPL)',
				'GNU Library or "Lesser" General Public License (LGPL)',
				'Mozilla Public License 2.0',
				'Common Development and Distribution License',
				'Eclipse Public License version 2.0',
				null,
			],
			type: 'string',
		},
		'Merge Strategies': {
			MERGE: { type: 'boolean' },
			REBASE: { type: 'boolean' },
			SQUASH: { type: 'boolean' },
		},
		'ProjectsEnabled?': { type: 'boolean' },
		ReqApprovingReviewCount: { minimum: 1, type: 'integer' },
		ReqApprovingReviews: { type: 'boolean' },
		ReqCodeOwnerReviews: { type: 'boolean' },
		'SecurityPolicyEnabled?': { type: 'boolean' },
		Subscription: {
			'enum': [
				'IGNORED', 'SUBSCRIBED', 'UNSUBSCRIBED',
			],
			type: 'string',
		},
		'WikiEnabled?': { type: 'boolean' },
	},
	required: ['DefBranch'],
	type: 'object',
};

const repoSchema = {
	id: '/repo',
	properties: {
		f: { type: 'string' },
		ignore: { type: 'string' },
	},
};

const configSchema = {
	id: '/config',
	properties: {
		defaultView: {
			'enum': ['tabular', 'csv'],
			required: true, type: 'string',
		},
		metrics: { $ref: '/metrics' },
	},
	repositories: {
		$ref: '/repo',
	},
	type: 'object',
};

schemaValidator.addSchema(metricSchema, '/metrics');
schemaValidator.addSchema(repoSchema, '/repo');

const { instance, errors } = schemaValidator.validate(config, configSchema);

if (errors && errors.length) {
	const errorList = errors.map((error) => `${error.instance} ${error.message}`);
	throw new Error(`Config validation error(s):\n${errorList.join('\n')}`);
}

module.exports = instance;

