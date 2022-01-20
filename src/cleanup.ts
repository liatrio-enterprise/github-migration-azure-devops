import {Octokit} from "@octokit/rest";

require('dotenv').config()

async function deleteGitHubRepos(repos: string[], org: string, token: string) {
    const octokit = new Octokit({auth: token})

    let deleteRepo = async function (repoName: string) {
        console.log(`Deleting ${repoName} in ${org}`)
        let deletion = octokit.rest.repos.delete({
            owner: org,
            repo: repoName
        })

        deletion.catch(reason => console.log(reason.status))
        deletion.then(value => console.log(value.status))
    }

    for (const repo of repos) {
        console.log(`Checking for ${repo} in ${org}`)

        let response = await octokit.rest.repos.get({
            owner: org,
            repo: repo
        }).catch(reason => {
            console.log(`${repo} not found in ${org} (got ${reason.status})`)
        });

        if (response?.status === 200) {
            console.log(`Found ${repo} already present in ${org}.`)
            deleteRepo(repo)
        }
        console.log("")
    }
}

/*
** WARNING **
This file is a helper/development script to make testing index.ts easier.
It will delete the repos specified below from the org specified below
 */

async function run() {
    let repos = ["repo-to-delete-1", "repo-to-delete-2"]
    await deleteGitHubRepos(repos, "org-with-repos-to-delete", process.env.GITHUB_TOKEN!)
}

let promise = run();