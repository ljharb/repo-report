'use strict';

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
const Validator = require('jsonschema').Validator;

const schemaValidator = new Validator();

const metricSchema = {
	id: '/metrics',
	properties: {
		BranchProtectionEnabled: { type: 'boolean' },
		defaultBranch: { required: true, type: 'string' },
		hasWikiEnabled: { type: 'boolean' },
		hasWriteAccess: { type: 'boolean' },
		isSecurityPolicyEnabled: { type: 'boolean' },
		rebaseMergeAllowed: { type: 'boolean' },
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

