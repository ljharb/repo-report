'use strict';

const cacheArgs = require('../cacheArgs');
const repoArgs = require('../repoArgs');

const ls = require('../../src/commands/ls');

module.exports.description = `Lists all repositories.
- Includes sources, forks, templates, private, and public repos by default.`;

module.exports.builder = (yargs) => cacheArgs(repoArgs(yargs))
	.default('actual', true)
	.hide('actual')
	.default('focus', function all() { return ['sources', 'forks', 'templates', 'private', 'public']; });

module.exports.handler = ls;
