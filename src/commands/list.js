const { Command, flags } = require("@oclif/command");
const { graphql } = require("@octokit/graphql");
const logSymbols = require("log-symbols");
require("dotenv").config();

const Table = require("cli-table");

class List extends Command {
  async run() {
    if (!process.env.GITHUB_PAT) {
      this.log(`${logSymbols.error} env variable GITHUB_PAT not found`);
    }
    // Field names and their extraction method to be used on the query result
    const fields = ["Repository", "Owner", "Access", "DefBranch", "isPublic"];
    const mappedFields = [
      (item) => item.name,
      (item) => item.owner.login,
      (item) => item.viewerPermission,
      (item) => (item.defaultBranchRef ? item.defaultBranchRef.name : "---"),
      (item) => (item.isPrivate ? logSymbols.error : logSymbols.success),
    ];

    const { flags } = this.parse(List);

    // List available fields
    if (flags.fields) {
      fields.map((item) => this.log(`- ${item}`));
      return;
    }

    // Group output
    let groupBy;
    if (flags.group) {
      groupBy = fields
        .map((item) => item.toLowerCase())
        .indexOf(flags.group.toLowerCase());
      if (groupBy === -1) {
        this.log(`${logSymbols.error} Invalid Field`);
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
              ${endCursor ? `after: "${endCursor}"` : ""}
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
    if (flags.group) {
      table = new Table({
        head: [fields[groupBy], "Repository"],
      });

      let groupedObj = {};
      repositories.forEach((item) => {
        const key = mappedFields[groupBy](item);
        if (key in groupedObj) {
          groupedObj[key].push(item.name);
        } else groupedObj[key] = [item.name];
      });

      Object.entries(groupedObj).forEach((item) => {
        table.push([item[0], item[1].join("\n")]);
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
          item.defaultBranchRef ? item.defaultBranchRef.name : "---",
          item.isPrivate ? logSymbols.error : logSymbols.success,
        ]);
      });
    }

    this.log(table.toString());

    this.log(`API Points:
    used\t-\t${points.cost}
    remaining\t-\t${points.remaining}`);
  }
}

List.description = `This command lists all of the repositories that the current user has.
NOTE: An environment variable GITHUB_PAT with the personal access token is required.
Also make sure that the token has read:org and all repo permissions.
`;

List.flags = {
  group: flags.string({
    char: "g",
    description: "field to be grouped by",
  }),
  fields: flags.boolean({
    char: "f",
    description: "show available fields",
  }),
};

module.exports = List;
