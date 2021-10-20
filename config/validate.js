/* eslint-disable no-magic-numbers */

'use strict';

const { Validator } = require('jsonschema');

const schemaValidator = new Validator();

const metricSchema = {
	additionalProperties: false,
	id: '/metrics',
	properties: {
		Access: {
			items: { type: 'string' },
			maxItems: 5,
			minItems: 1,
			type: ['array', 'null'],
			uniqueItems: true,
		},
		AllowsDeletions: { type: ['boolean', 'null'] },
		AllowsForcePushes: { type: ['boolean', 'null'] },
		AllowsForking: { type: ['boolean', 'null'] },
		Archived: { type: ['boolean', 'null'] },
		AutoMergeAllowed: { type: ['boolean', 'null'] },
		BlankIssuesEnabled: { type: ['boolean', 'null'] },
		DefBranch: {
			oneOf: [
				{ type: ['string', 'null'] },
				{
					items: { type: ['string', 'null'] },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
		DeleteOnMerge: { type: ['boolean', 'null'] },
		DismissesStaleReviews: { type: ['boolean', 'null'] },
		HasStarred: { type: ['boolean', 'null'] },
		IssuesEnabled: { type: ['boolean', 'null'] },
		License: {
			oneOf: [
				{ type: ['string', 'null'] },
				{
					items: { type: ['string', 'null'] },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
		MergeStrategies: {
			additionalProperties: false,
			properties: {
				MERGE: { type: ['boolean', 'null'] },
				REBASE: { type: ['boolean', 'null'] },
				SQUASH: { type: ['boolean', 'null'] },
			},
			type: ['object', 'null'],

		},
		ProjectsEnabled: { type: ['boolean', 'null'] },
		ReqApprovingReviewCount: {
			maximum: 6,
			minimum: 1,
			type: ['integer', 'null'],
		},
		ReqApprovingReviews: { type: ['boolean', 'null'] },
		ReqCodeOwnerReviews: { type: ['boolean', 'null'] },
		ReqConversationResolution: { type: ['boolean', 'null'] },
		SecurityPolicyEnabled: { type: ['boolean', 'null'] },
		Subscription: {
			oneOf: [
				{
					enum: [
						'IGNORED',
						'SUBSCRIBED',
						'UNSUBSCRIBED',
						null,
					],
					type: ['string', 'null'],
				},
				{
					items: {
						enum: [
							'IGNORED',
							'SUBSCRIBED',
							'UNSUBSCRIBED',
							null,
						],
						type: ['string', 'null'],
					},
					type: 'array',
					uniqueItems: true,
				},
			],
		},
		WikiEnabled: { type: ['boolean', 'null'] },
	},
	type: 'object',
};

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

