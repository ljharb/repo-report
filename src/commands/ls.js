'use strict';

const { getRepositories } = require('../getRepositories');
const loadingIndicator = require('../loadingIndicator');

module.exports = async function ls(flags) {
	const { points, repositories } = await loadingIndicator(() => getRepositories(flags));
	return { points, repositories };
};
