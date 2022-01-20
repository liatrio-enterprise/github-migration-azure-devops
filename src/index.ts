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

async function createGitHubRepos(repos: GitInterfaces.GitRepository[], org: string, github_pat: string, azure_pat: string) {
    const octokit = new Octokit({auth: github_pat})

    let createRepo = async function (repoName: string, vsc_url: string) {
        console.log(`Creating ${repoName} in ${org}`)
        const creationResult = await octokit.rest.repos.createInOrg({
            org: org,
            name: repoName,
            allow_merge_commit: false,
            allow_rebase_merge: false,
            private: true,
            visibility: "internal"
        }).catch(reason => {
            console.log('Repo creation failed:')
            console.log(reason)
        });
        if (!creationResult) {
            return;
        }
        console.log(`Creation complete for ${repoName} in ${org} (status: ${creationResult.status})`)

        console.log(`Starting import for ${creationResult!?.data.name}`)
        const importResult = await octokit.rest.migrations.startImport({
            owner: org,
            repo: creationResult!?.data.name,
            vcs: "git",
            vcs_password: azure_pat,
            vcs_url: vsc_url
        }).catch(reason => {
            console.log('Repo importation failed:')
            console.log(reason)
        });
        if (importResult) {
            console.log(`Finished importing ${repoName} in ${org} (status: ${importResult.status})`)
        }
    }

    const promises = repos.map(async repo => {
        console.log(`Checking for ${repo.name} in ${org}`)

        const response = await octokit.rest.repos.get({
            owner: org,
            repo: repo.name!
        }).catch(async reason => {
            console.log(`${repo.name} not found in ${org} (got ${reason.status})`)
            if (reason.status === 404) {
                await createRepo(repo.name!, repo.remoteUrl!)
            }
        });

        if (response) {
            console.log(`Found ${repo.name} already present in ${org} (response: ${response?.status}`)
        }
    })

    await Promise.all(promises)
    console.log(`Importation complete for ${org}`)
}

(async () => {
    let repos = await getADORepos(process.env.ADO_ORG!, process.env.AZURE_PERSONAL_ACCESS_TOKEN!, process.env.ADO_PROJECT_NAME!)
    await createGitHubRepos(repos, process.env.GITHUB_ORG!, process.env.GITHUB_TOKEN!, process.env.AZURE_PERSONAL_ACCESS_TOKEN!)
})()