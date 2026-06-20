'use strict';

const { Validator } = require('jsonschema');

const schemaValidator = new Validator();

/** @type {import('../config/metrics.json')} */
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

/** @import { ValidationError } from 'jsonschema' */

/** @type {(config: object) => ValidationError[]} */
module.exports = function validate(config) {
	return schemaValidator.validate(config, configSchema).errors;
};
