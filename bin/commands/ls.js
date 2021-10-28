'use strict';

const cacheArgs = require('../cacheArgs');
const repoArgs = require('../repoArgs');

const detail = require('./detail');

module.exports.description = `Lists all repositories.
- Includes sources, forks, templates, private, and public repos by default.
- Shows DefBranch and Access metrics by default.`;

module.exports.builder = (yargs) => cacheArgs(repoArgs(yargs))
	.default('actual', true)
	.hide('actual')
	.default('focus', function all() { return ['sources', 'forks', 'templates', 'private', 'public']; })
	.default('pick', ['DefBranch', 'Access'])
	.hide('pick');

module.exports.handler = detail;
