# repo-report <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![dependency status][deps-svg]][deps-url]
[![dev dependency status][dev-deps-svg]][dev-deps-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

CLI to list all repos a user has access to, and report on their configuration in aggregate.

# Installation

- `npm install` to install all dependencies
- create `.env` file and initialize `GH_TOKEN` or `GITHUB_TOKEN` (in order of precedence) with your Github token

# Usage (for public)

- generate a personal access token using github [here](https://github.com/settings/tokens) and add the `repo` scope to it.
- on the terminal run `export GH_TOKEN=<the personal access token generated>`
- run `npx repo-report`

# Usage (for Contributors)

- execute `./bin/run` to get a report of all your repositories in the terminal

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
