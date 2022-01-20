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

async function run() {
    let repos = ["kingfisher-demo-infra-deploy",
        "kingfisher-demo",
        "kingfisher-demo-api",
        "kingfisher-demo-app-deploy",
        "kingfisher-demo-ui"]
    await deleteGitHubRepos(repos, process.env.GITHUB_ORG!, process.env.GITHUB_TOKEN!)
}

let promise = run();