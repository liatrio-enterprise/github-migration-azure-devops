import * as nodeApi from 'azure-devops-node-api';
import * as GitApi from 'azure-devops-node-api/GitApi';
import * as GitInterfaces from 'azure-devops-node-api/interfaces/GitInterfaces';
import {Octokit} from "@octokit/rest";

require('dotenv').config()

async function getADORepos(adoOrgURL: string, adoToken: string, projectName: string) {
    let webApi = new nodeApi.WebApi(adoOrgURL, nodeApi.getPersonalAccessTokenHandler(adoToken));
    const gitApiObject: GitApi.GitApi = await webApi.getGitApi()
    return gitApiObject.getRepositories(projectName)
}



async function createGitHubRepos(repos: GitInterfaces.GitRepository[], org: string, token: string) {
    const octokit = new Octokit({auth: token})

    let createRepo = function (repoName: string){
        console.log(`Creating ${repoName} in ${org}`)
        octokit.rest.repos.createInOrg({
            org: org,
            name: repoName,
            allow_merge_commit: true,
            allow_rebase_merge: false
        }).catch(reason => console.log(reason))
    }

    for (const repo of repos) {
        console.log(`Checking for ${repo.name} in ${org}`)

        let response = await octokit.rest.repos.get({
            owner: org,
            repo: repo.name!
        }).catch(reason => {
            console.log(`${repo.name} not found in ${org} (got ${reason.status})`)
            if(reason.status === 404){
                createRepo(repo.name!)
            }
        });

        if (response) {
            console.log(`Found ${repo.name} already present in ${org}.`)
        }
        console.log("")
    }
}

async function run() {
    let repos = await getADORepos(process.env.ADO_ORG!, process.env.AZURE_PERSONAL_ACCESS_TOKEN!, "kingfisher-demo")
    await createGitHubRepos(repos, process.env.GITHUB_ORG!, process.env.GITHUB_TOKEN!)
}

let promise = run();