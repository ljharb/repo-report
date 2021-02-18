# repo-report
CLI to list all repos a user has access to, and report on their configuration in aggregate.

# Installation

- `npm install` to install all dependencies

# Usage
 
 - `node ./src/index.js list` to have a list of repos with different fields: access, default branch, etc.


# In a NutShell

	- write a tool that uses the github API to find all the repos i have write access to, and:
		- lists the default branch name, grouped by repo
		- lists the branch protections on the default branch, grouped by repo, so i can quickly see what's different from the majority
		- diffs the github actions workflow files, listing all the repos and diffs where something is different
		- lists the various other settings on the Options page, grouped by repo, so i can see what's different
		
 
	- write a tool that takes a SHA (or infers it from HEAD), looks up the PR for that sha, and checks the github API to see if it's ready to land: ie, all required status checks pass and all optional status checks are completed.
		- bonus: add an option that polls until the final status is known

