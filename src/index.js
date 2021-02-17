#!/usr/bin/env node

'use strict';

require('dotenv').config();
var Yargs = require('yargs');
var list = require('./commands/list');

var argv = Yargs.usage('Usage: $0 <command> [options]')
	.command('list', 'lists all repositories', function (yargs) {
		argv = yargs
			.usage('Usage: $0 list [options]')
			.alias('g', 'group-by')
			.nargs('g', 1)
			.describe('g', 'Field to be grouped by')
			.alias('f', 'fields')
			.boolean('f')
			.describe('f', 'Show available fields')
			.help('h')
			.alias('h', 'help').argv;
		list(argv);
	})
	.help('h')
	.alias('h', 'help').argv;
