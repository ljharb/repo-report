'use strict';

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
const Validator = require('jsonschema').Validator;

const schemaValidator = new Validator();

const metricSchema = {
	id: '/metrics',
	properties: {
		Access: { type: 'array' },
		AllowsDeletions: { type: 'boolean' },
		AllowsForcePushes: { type: 'boolean' },
		'Archived?': { type: 'boolean' },
		'BlankIssuesEnabled?': { type: 'boolean' },
		DefBranch: 'master',
		DeleteOnMerge: { type: 'boolean' },
		DismissesStaleReviews: { type: 'boolean' },
		'HasStarred?': { type: 'boolean' },
		'IssuesEnabled?': { type: 'boolean' },
		License: { type: 'array' },
		'Merge Strategies': {
			MERGE: { type: 'boolean' },
			REBASE: { type: 'boolean' },
			SQUASH: { type: 'boolean' },
		},
		'ProjectsEnabled?': { type: 'boolean' },
		ReqApprovingReviewCount: { type: 'integer' },
		ReqApprovingReviews: { type: 'boolean' },
		ReqCodeOwnerReviews: { type: 'boolean' },
		'SecurityPolicyEnabled?': { type: 'boolean' },
		Subscription: { type: 'array' },
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
const { instance, errors } = schemaValidator.validate(config, configSchema);

if (errors && errors.length) {
	const errorList = errors.map((error) => `${error.instance} ${error.message}`);
	throw new Error(`Config validation error(s):\n${errorList.join('\n')}`);
}

module.exports = instance;

