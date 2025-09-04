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
								requireLastPushApproval
								requiresStrictStatusChecks
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

function sortRepositories(repos, flags) {
	if (flags.sort === 'name' || flags.sort === '') {
		repos.sort((a, b) => (flags.desc
			? b.name.localeCompare(a.name) // Z → A
			: a.name.localeCompare(b.name))); // A → Z
	} else if (flags.sort === 'updated') {
		repos.sort((a, b) => (flags.desc
			? new Date(b.updatedAt) - new Date(a.updatedAt) // newest → oldest
			: new Date(a.updatedAt) - new Date(b.updatedAt))); // oldest → newest
	} else if (flags.sort === 'created') {
		repos.sort((a, b) => (flags.desc
			? new Date(b.createdAt) - new Date(a.createdAt) // oldest → newest
			: new Date(a.createdAt) - new Date(b.createdAt))); // newest → oldest
	} else {
		throw new TypeError(`Invalid sort option: ${flags.sort}`);
	}
	return repos;
}

async function getRepositories(flags, filter) {
	const { points, repositories } = await getRepos(generateQuery, flags, { filter });
	const sortedRepo = sortRepositories(repositories, flags);
	return { points, repositories: sortedRepo };
}

module.exports = {
	getRepositories,
	sortRepositories,
};
