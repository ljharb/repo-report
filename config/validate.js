/* eslint-disable no-magic-numbers */

'use strict';

const { Validator } = require('jsonschema');

const schemaValidator = new Validator();

const metricSchema = require('./metrics.json');

const repoSchema = {
	additionalProperties: false,
	id: '/repo',
	properties: {
		focus: {
			oneOf: [
				{ type: 'string' },
				{
					items: { type: 'string' },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
		ignore: {
			oneOf: [
				{ type: 'string' },
				{
					items: { type: 'string' },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
	},
};

const overridesSchema = {
	additionalProperties: false,
	id: '/overrides',
	properties: {
		metrics: { $ref: '/metrics' },
		repos: {
			oneOf: [
				{ type: 'string' },
				{
					items: { type: 'string' },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
	},
};

const configSchema = {
	additionalProperties: false,
	id: '/config',
	properties: {
		metrics: { $ref: '/metrics' },
		overrides: {
			$ref: '/overrides',
		},
		repositories: {
			$ref: '/repo',
		},
	},
	type: 'object',

};

schemaValidator.addSchema(metricSchema, '/metrics');
schemaValidator.addSchema(repoSchema, '/repo');
schemaValidator.addSchema(overridesSchema, '/overrides');

module.exports = (config) => {
	const { errors } = schemaValidator.validate(config, configSchema);
	if (errors && errors.length) {
		const errorList = errors.map((error) => {
			if (error.name === 'oneOf') {
				return `config${error.path.length > 0 ? '.' : ''}${error.path.join('.')} has duplicate values`;
			}
			return `config${error.path.length > 0 ? '.' : ''}${error.path.join('.')} ${error.message}`;
		});
		return { error: `Config validation error(s):\n\t${errorList.join('\n\t')}`, valid: false };
	}

	return { valid: true };
};

