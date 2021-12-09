'use strict';

const { Validator } = require('jsonschema');

const schemaValidator = new Validator();

const metricSchema = require('../config/metrics.json');

const configSchema = {
	additionalProperties: false,
	id: '/config',
	properties: {
		metrics: { $ref: '/metrics' },
	},
	type: 'object',
};

schemaValidator.addSchema(metricSchema, '/metrics');

module.exports = (config) => schemaValidator.validate(config, configSchema).errors;
