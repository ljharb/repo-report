'use strict';

/** @import { Flags } from '../types' */

const { getRepositories } = require('../getRepositories');
const loadingIndicator = require('../loadingIndicator');

/** @type {(flags: Flags) => ReturnType<typeof getRepositories>} */
module.exports = async function ls(flags) {
	const { points, repositories } = await loadingIndicator(() => getRepositories(flags));
	return { points, repositories };
};
