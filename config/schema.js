'use strict';

const joi = require('joi');
const fs = require('fs');
const conf = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));

const configSchema = joi.object({
	defaultView: joi.string().valid('tabular', 'csv').required(),
	metrics: joi.object().keys({
		defaultBranch: joi.string().valid('master', 'main').required(),
		hasWikiEnabled: joi.boolean(),
		hasWriteAccess: joi.boolean(),
		isBranchProtectionEnabled: joi.boolean(),
		isSecurityPolicyEnabled: joi.boolean(),
		rebaseMergeAllowed: joi.boolean(),
	}),
	repositories: joi.object().keys({
		f: joi.string().valid('npm*').required(),
		ignore: joi.string().valid('es5-shim*').required(),
	}),
});

const { value, error } = configSchema.validate(conf);

if (error) {
	throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
	value,
};

