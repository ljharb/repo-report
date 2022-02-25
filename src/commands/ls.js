'use strict';

const getRepositories = require('../getRepositories');

module.exports = async function ls(flags) {
	let filter;
	if (flags.focus?.length === 1 && flags.focus[0] === 'templates') {
		filter = (repo) => repo.isTemplate;
	}

	// Get all repositories
	const { repositories } = await getRepositories(flags, filter);

	repositories.forEach((repository) => {
		console.log(repository.nameWithOwner);
	});
	return null;
};
