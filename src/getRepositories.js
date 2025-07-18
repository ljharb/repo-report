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
        						requiresDeployments
        						requiredDeploymentEnvironments
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
	// console.log("points:::::::", points)
	// console.log("repositories:::::::::", repositories)
for (const repo of repositories) {
  const rule = repo.defaultBranchRef?.branchProtectionRule;

  if (!rule) {
    console.log(`${repo.nameWithOwner}: (no rule)`);
    continue;
  }

  // Pretty-print the whole thing
  console.log(`${repo.nameWithOwner}:`);
  console.dir(rule, { depth: null, colors: true });

  // Or grab just what you need
  console.log('  requiresDeployments:', rule.requiresDeployments);
  console.log('  environments:', rule.requiredDeploymentEnvironments?.join(', '));
}
	if (!flags.sort) {
		repositories.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
	}

	return { points, repositories };
};
