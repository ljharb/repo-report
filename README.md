# 🧾 Repo-Report

**Repo-Report** is a simple command-line tool (CLI) that helps you get a quick overview of all your GitHub repositories in one place.

Instead of clicking through every repo manually on GitHub, Repo-Report shows important info like whether issues are turned on, if the repo has a license, when it was last updated, and more — all from one command.

It’s perfect for developers, students, or maintainers who want a clear summary of their GitHub projects.

---

## 🛠️ How It Works

1. **You run the tool in your terminal.**
2. **Repo-Report connects to GitHub using your personal access token (PAT).**  
   This is a password-like key GitHub gives you to allow tools to access your repos.
3. **It scans every repository you have access to** — personal or organizational.
4. **You get a report in your terminal** that shows useful details about each repo.

Here’s what it looks at by default:
- ✅ Are GitHub Issues turned on?
- 🗂️ Are GitHub Projects enabled?
- 📜 Does the repo have a license file?
- 📖 Is the GitHub Wiki enabled?
- 🔐 Is the repo public, private, or internal?
- 🧪 Are GitHub Actions workflows present?
- 🧩 Are topics/tags set?
- 🕒 When was the last push?
- 🧑‍🤝‍🧑 How many collaborators are there?

---

## 🚀 Getting Started

Installation
npm install to install all dependencies
create .env file and initialize GH_TOKEN or GITHUB_TOKEN (in order of precedence) with your Github token
Usage (for public)
generate a personal access token using github here and add the repo scope to it.
on the terminal run export GH_TOKEN=<the personal access token generated>
run npx repo-report
Usage (for Contributors)
execute ./bin/run to get a report of all your repositories in the terminal
