'use strict';

const getRepositories = require('../getRepositories');
const loadingIndicator = require('../loadingIndicator');

module.exports = async function ls(flags) {
	let filter;
	if (flags.focus?.length === 1 && flags.focus[0] === 'templates') {
		filter = (repo) => repo.isTemplate;
	}

	// Get all repositories
	const { repositories } = await loadingIndicator(() => getRepositories(flags, filter));

	repositories.forEach((repository) => {
		console.log(repository.nameWithOwner);
	});
	return null;
};
