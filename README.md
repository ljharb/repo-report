# repo-report <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

CLI to list all repos a user has access to, and report on their configuration in aggregate.

# Installation

- `npm install` to install all dependencies
- create `.env` file and initialize `GH_TOKEN` or `GITHUB_TOKEN` (in order of precedence) with your Github token

# Getting Started

## Creating a Personal Access Token (PAT)

1. Go to [GitHub Tokens Settings](https://github.com/settings/tokens).
2. Click **Generate new token**.
3. Give it a descriptive name (e.g., "my repo-report token").
4. Select the `repo` scope.
5. Generate the token and copy it.

---

## Using your PAT with Repo-Report

- You can set your token as an environment variable in your terminal:
- run `export GH_TOKEN=<your_personal_access_token>`

OR you can add it to a .env file in the project root:
- run `GH_TOKEN=your_personal_access_token`


# Usage (for public)

- After you generated your PAT you can open terminal then do the following:
- on the terminal run `export GH_TOKEN=<the personal access token generated>`
- run `npx repo-report`

# Usage (for Contributors)

- execute `./bin/run` to get a report of all your repositories in the terminal

# Running Repo-Report with ``npx repo-report --help``

1. ``--help``
- Show all available flags and usage examples.

2. ``--unactionable``
- Shows metrics you can’t change

3. ``--actual``
- Shows raw values instead of a ✅ or ❌

4. ``--goodness``
- Shows if a metric is "good" (✅) or "bad" (❌)

5. ``-m, --metrics``
- Lists available metrics.

6. ``--all``
- Shows ALL metrics (Even ones that aren't actionable)

7. ``-p, --pick``
- Lets you select specific metrics

8. ``-f, --focus``
- Filters by repo type such as sources, forks, templates, private or public

9. ``--names``
- Shows repo names alongside their owners

10. ``-s, --sort``
- Sorts alphabetically (It's sorted by last updated by default)

11. ``--cache``
- Saves API request data in ``--cacheDir``.


# Optional (but helpful)
- If you would like an extended and more detailed view of your repos you can use:
- `npx repo-report --all --actual`
- If you would like to have this be the default view whenever you run repo-report, you can run with:
-  `alias repo-report='npx repo-report --all --actual`
- then run `source ~/.bashrc`

## Repo-Report Dashboard

The following shows an example output of repo-report --all --actual for my repositories. It shows important repository settings like issues, projects, branch protection, and allowed merge strategies. Additional details such as auto-merge, branch deletion on merge, and license information are also included in the full output as seen by the extended table below.

![Repo-Report Dashboard Example](./Repo-Report%20Table.png)

[package-url]: https://npmjs.org/package/repo-report
[npm-version-svg]: https://versionbadg.es/ljharb/repo-report.svg
[deps-svg]: https://david-dm.org/ljharb/repo-report.svg
[deps-url]: https://david-dm.org/ljharb/repo-report
[dev-deps-svg]: https://david-dm.org/ljharb/repo-report/dev-status.svg
[dev-deps-url]: https://david-dm.org/ljharb/repo-report#info=devDependencies
[npm-badge-png]: https://nodei.co/npm/repo-report.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/repo-report.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/repo-report.svg
[downloads-url]: https://npm-stat.com/charts.html?package=repo-report
[codecov-image]: https://codecov.io/gh/ljharb/repo-report/branch/main/graphs/badge.svg
[codecov-url]: https://app.codecov.io/gh/ljharb/repo-report/
[actions-image]: https://img.shields.io/endpoint?url=https://github-actions-badge-u3jn4tfpocch.runkit.sh/ljharb/repo-report
[actions-url]: https://github.com/ljharb/repo-report/actions
