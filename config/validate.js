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
			type: 'array',
			uniqueItems: true,
		},
		AllowsDeletions: { type: 'boolean' },
		AllowsForcePushes: { type: 'boolean' },
		Archived: { type: 'boolean' },
		BlankIssuesEnabled: { type: 'boolean' },
		DefBranch: {
			oneOf: [
				{ type: 'string' },
				{ type: 'null' },
				{
					items: { type: ['string', 'null'] },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
		DeleteOnMerge: { type: 'boolean' },
		DismissesStaleReviews: { type: 'boolean' },
		HasStarred: { type: 'boolean' },
		IssuesEnabled: { type: 'boolean' },
		License: {
			oneOf: [
				{ type: 'string' },
				{ type: 'null' },
				{
					items: { type: ['string', 'null'] },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
		MergeStrategies: {
			MERGE: { type: 'boolean' },
			REBASE: { type: 'boolean' },
			SQUASH: { type: 'boolean' },
		},
		ProjectsEnabled: { type: 'boolean' },
		ReqApprovingReviewCount: {
			maximum: 6,
			minimum: 1,
			type: 'integer',
		},
		ReqApprovingReviews: { type: 'boolean' },
		ReqCodeOwnerReviews: { type: 'boolean' },
		ReqConversationResolution: { type: 'boolean' },
		SecurityPolicyEnabled: { type: 'boolean' },
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
		WikiEnabled: { type: 'boolean' },
	},
	required: ['DefBranch'],
	type: 'object',
};

const repoSchema = {
	additionalProperties: false,
	id: '/repo',
	properties: {
		focus: {
			oneOf: [
				{ type: 'string' }, {
					items: { type: 'string' },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
		ignore: {
			oneOf: [
				{ type: 'string' }, {
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
