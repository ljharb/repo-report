'use strict';

const { getRepositories: getRepos } = require('./utils');

function hasFlag(flag, flags, defaultValue = false) {
	return !!(flags?.length > 0 ? flags?.includes(flag) : defaultValue);
}

function generateQuery(endCursor, { f }, perPage = 20) {
	const showForks = hasFlag('forks', f);
	const showSources = hasFlag('sources', f, true);
	const showPrivate = hasFlag('private', f);
	const showPublic = hasFlag('public', f, true);

	return `
		query {
			viewer {
				repositories(
					first: ${perPage}
					affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
					${endCursor ? `after: "${endCursor}"` : ''}
					${showForks === showSources ? '' : `isFork: ${!!showForks}`}
					${showPrivate === showPublic ? '' : `privacy: ${showPublic ? 'PUBLIC' : 'PRIVATE'}`}
				) {
					totalCount
					pageInfo {
						endCursor
						hasNextPage
					}
					nodes {
						name
						nameWithOwner
						defaultBranchRef {
							name
							branchProtectionRule {
								allowsForcePushes
								allowsDeletions
								dismissesStaleReviews
								requiredApprovingReviewCount
								requiresApprovingReviews
								requiresCodeOwnerReviews
								requiresConversationResolution
								restrictsPushes
								requiredStatusChecks {
									app {
										id
									}
								}
							}
						}
						deleteBranchOnMerge
						hasIssuesEnabled
						hasProjectsEnabled
						hasDiscussionsEnabled
						hasWikiEnabled
						webCommitSignoffRequired
						forkingAllowed
						isArchived
						autoMergeAllowed
						squashMergeCommitTitle
						isBlankIssuesEnabled
						isFork
						isPrivate
						isSecurityPolicyEnabled
						codeOfConduct {
							name
						}
						isTemplate
						licenseInfo {
							name
						}
						mergeCommitAllowed
						owner {
							login
						}
						rebaseMergeAllowed
						squashMergeAllowed
						createdAt
						updatedAt
						pushedAt
						viewerHasStarred
						viewerPermission
						viewerSubscription
					}
				}
			}
			rateLimit {
				cost
				remaining
			}
		}
	`;
}

module.exports = async function getRepositories(flags, filter) {
	// Get all repositories
	const { points, repositories } = await getRepos(generateQuery, flags, { filter });

	if (flags.sortByName) {
		repositories.sort((a, b) => a.name.localeCompare(b.name)); // A → Z
	}else if (flags.sortByNameDesc) {
		repositories.sort((a, b) => b.name.localeCompare(a.name)); // Z → A
	}else if (flags.sortByModifiedDate) {
		repositories.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
	}else if (flags.sortByModifiedDateDesc) {
		repositories.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
	}else if (flags.sortByCreatedDate) {
		repositories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	}else if (flags.sortByCreatedDateDesc) {
		repositories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
	}else if (!flags.sort) {
		repositories.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
	}

	return { points, repositories };
};
