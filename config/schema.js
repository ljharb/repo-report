/* eslint-disable no-magic-numbers */

'use strict';

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
const { Validator } = require('jsonschema');

const schemaValidator = new Validator();

const metricSchema = {
	id: '/metrics',
	properties: {
		Access: {
			items: {
				type: 'string',
			},
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
				{ type: 'string' }, {
					items: {
						type: ['string', 'null'],
					},
					type: 'array',
					uniqueItems: true,
				}, { type: 'null' },
			],
		},
		DeleteOnMerge: { type: 'boolean' },
		DismissesStaleReviews: { type: 'boolean' },
		HasStarred: { type: 'boolean' },
		IssuesEnabled: { type: 'boolean' },
		License: {
			type: ['string', 'null'],
		},
		MergeStrategies: {
			MERGE: { type: 'boolean' },
			REBASE: { type: 'boolean' },
			SQUASH: { type: 'boolean' },
		},
		ProjectsEnabled: { type: 'boolean' },
		ReqApprovingReviewCount: {
			maximum: 6, minimum: 1, type: 'integer',
		},
		ReqApprovingReviews: { type: 'boolean' },
		ReqCodeOwnerReviews: { type: 'boolean' },
		SecurityPolicyEnabled: { type: 'boolean' },
		Subscription: {
			oneOf: [
				{
					'enum': [
						'IGNORED', 'SUBSCRIBED', 'UNSUBSCRIBED', null,
					],
					type: ['string', 'null'],
				},
				{
					items: {
						'enum': [
							'IGNORED', 'SUBSCRIBED', 'UNSUBSCRIBED', null,
						],
						type: ['string', 'null'],
					},
					type: 'array',
				},
			],
		},
		WikiEnabled: { type: 'boolean' },
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

