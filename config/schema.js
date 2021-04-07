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
			items: { type: 'string' },
			type: 'array',
			uniqueItems: true,
		},
		AllowsDeletions: { type: 'boolean' },
		AllowsForcePushes: { type: 'boolean' },
		'Archived?': { type: 'boolean' },
		'BlankIssuesEnabled?': { type: 'boolean' },
		DefBranch: 'main',
		DeleteOnMerge: { type: 'boolean' },
		DismissesStaleReviews: { type: 'boolean' },
		'HasStarred?': { type: 'boolean' },
		'IssuesEnabled?': { type: 'boolean' },
		License: { items: { type: 'string' }, type: 'array' },
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
			items: { type: 'string' },
			minItems: 1,
			type: 'array',
			uniqueItems: true,
		},
		'WikiEnabled?': { type: 'boolean' },
	},
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
			format: 'defaultView', required: true, type: 'string',
		},
		metrics: { $ref: '/metrics' },
	},
	type: 'object',
};

schemaValidator.addSchema(metricSchema, '/metrics');
schemaValidator.addSchema(repoSchema, '/repo');
console.log(configSchema);
const { instance, errors } = schemaValidator.validate(config, configSchema);
console.log(instance, '*******');
if (errors && errors.length) {
	// const errorList = errors.map((error) => `${error.instance} ${error.message}`);
	console.log('hello');
	// throw new Error(`Config validation error(s):\n${errorList.join('\n')}`);
}

module.exports = instance;

