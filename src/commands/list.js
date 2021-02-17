const { graphql } = require('@octokit/graphql');
const logSymbols = require('log-symbols');
const Table = require('cli-table');

const list = async (flags) => {
	if (!process.env.GITHUB_PAT) {
		console.log(`${logSymbols.error} env variable GITHUB_PAT not found`);
	}

	// Field names and their extraction method to be used on the query result
	const fields = ['Repository', 'Owner', 'Access', 'DefBranch', 'isPublic'];
	const mappedFields = [
		(item) => item.name,
		(item) => item.owner.login,
		(item) => item.viewerPermission,
		(item) => (item.defaultBranchRef ? item.defaultBranchRef.name : '---'),
		(item) => (item.isPrivate ? logSymbols.error : logSymbols.success),
	];

	// List available fields
	if (flags.f) {
		fields.map((item) => console.log(`- ${item}`));
		return;
	}

	// Group output
	let groupBy;
	if (flags.g) {
		groupBy = fields
			.map((item) => item.toLowerCase())
			.indexOf(flags.g.toLowerCase());
		if (groupBy === -1) {
			console.log(`${logSymbols.error} Invalid Field`);
			return;
		}
	}

	// Repeated requests to get all repositories
	let endCursor,
		hasNextPage,
		points,
		repositories = [];

	do {
		const {
			viewer: {
				repositories: { nodes, pageInfo },
			},
			rateLimit,
		} = await graphql(
			`
        query {
          viewer {
            repositories(
              first: 100
              affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
              ${endCursor ? `after: "${endCursor}"` : ''}
            ) {
              totalCount
              pageInfo {
                endCursor
                hasNextPage
              }
              nodes {
                name
                owner {
                  login
                }
                isPrivate
                defaultBranchRef {
                    name
                }
                viewerPermission
              }
            }
          }
          rateLimit {
            cost
            remaining
          }
        }
      `,
			{
				headers: {
					authorization: `token ${process.env.GITHUB_PAT}`,
				},
			}
		);

		endCursor = pageInfo.endCursor;
		hasNextPage = pageInfo.hasNextPage;
		points = rateLimit;
		repositories = repositories.concat(nodes);
	} while (hasNextPage);

	let table;

	// Grouped output
	if (flags.g) {
		table = new Table({
			head: [fields[groupBy], 'Repository'],
		});

		const groupedObj = {};
		repositories.forEach((item) => {
			const key = mappedFields[groupBy](item);
			if (key in groupedObj) {
				groupedObj[key].push(item.name);
			} else { groupedObj[key] = [item.name]; }
		});

		Object.entries(groupedObj).forEach((item) => {
			table.push([item[0], item[1].join('\n')]);
		});
	} else {
		table = new Table({
			head: fields,
		});

		repositories.forEach((item) => {
			table.push([
				item.name,
				item.owner.login,
				item.viewerPermission,
				item.defaultBranchRef ? item.defaultBranchRef.name : '---',
				item.isPrivate ? logSymbols.error : logSymbols.success,
			]);
		});
	}

	console.log(table.toString());

	console.log(`API Points:
    used\t-\t${points.cost}
    remaining\t-\t${points.remaining}`);
};

module.exports = list;
