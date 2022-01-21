import * as nodeApi from 'azure-devops-node-api';
import * as GitApi from 'azure-devops-node-api/GitApi';
import * as GitInterfaces from 'azure-devops-node-api/interfaces/GitInterfaces';
import {Octokit, RestEndpointMethodTypes} from "@octokit/rest";

require('dotenv').config()

async function getADORepos(adoOrgURL: string, adoToken: string, projectName: string) {
    let webApi = new nodeApi.WebApi(adoOrgURL, nodeApi.getPersonalAccessTokenHandler(adoToken));
    const gitApiObject: GitApi.GitApi = await webApi.getGitApi()
    const repositories = await gitApiObject.getRepositories(projectName)

    console.log(`Found the following repos under ${adoOrgURL}/${projectName}`)
    repositories.map(value => console.log(`* ${value.name}`))
    console.log("")

    return repositories
}

async function createGitHubRepos(repos: GitInterfaces.GitRepository[],
                                 org: string,
                                 github_pat: string,
                                 azure_pat: string,
                                 teamName: string | undefined) {
    const octokit = new Octokit({auth: github_pat})

    let createRepo = async function (repoName: string, vsc_url: string) {
        console.log(`${repoName}: creating in ${org}`)

        const creationResult = await octokit.rest.repos.createInOrg({
            org: org,
            name: repoName,
            allow_merge_commit: false,
            allow_rebase_merge: false,
            private: true,
            visibility: <RestEndpointMethodTypes["repos"]["createInOrg"]["parameters"]["visibility"]>"internal"
        }).catch(reason => {
            console.log(`${repoName}: repo creation failed:`)
            console.log(reason)
        });
        if (!creationResult) {
            return;
        }
        console.log(`${repoName}: creation complete in ${org} (status: ${creationResult.status})`)

        if (teamName) {
            console.log(`${repoName}: adding ${teamName} as maintainers`)
            octokit.rest.repos.addTeamAccessRestrictions
            const teamResult = await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
                org: org,
                owner: org,
                permission: <RestEndpointMethodTypes["teams"]["addOrUpdateRepoPermissionsInOrg"]["parameters"]["permission"]>"maintain",
                repo: repoName,
                team_slug: teamName
            }).catch(reason => console.log(`${repoName}: error adding ${teamName} as maintainers:\n${reason}`))
            if (teamResult) {
                console.log(`${repoName}: added ${teamName} as maintainers`)
            }
        }

        console.log(`${repoName}: starting import to ${org}`)
        const importResult = await octokit.rest.migrations.startImport({
            owner: org,
            repo: creationResult!?.data.name,
            vcs: <RestEndpointMethodTypes["migrations"]["startImport"]["parameters"]["vcs"]>"git",
            vcs_password: azure_pat,
            vcs_url: vsc_url
        }).catch(reason => {
            console.log(`${repoName}: repo importation failed:`)
            console.log(reason)
        });
        if (importResult) {
            console.log(`${repoName}: import started successfully in ${org} (status: ${importResult.status})`)
        }
    }

    const promises = repos.map(async repo => {
        console.log(`${repo.name}: checking if present in ${org}`)

        const response = await octokit.rest.repos.get({
            owner: org,
            repo: repo.name!
        }).catch(async reason => {
            console.log(`${repo.name}: not found in ${org} (status: ${reason.status})`)
            if (reason.status === 404) {
                await createRepo(repo.name!, repo.remoteUrl!)
            }
        });

        if (response) {
            console.log(`${repo.name}: already present in ${org} (status: ${response?.status}`)
        }
    })

    await Promise.all(promises)
    console.log(`Importation complete for ${org}`)
}

(async () => {
    let repos = await getADORepos(process.env.ADO_ORG!, process.env.AZURE_PERSONAL_ACCESS_TOKEN!, process.env.ADO_PROJECT_NAME!)
    await createGitHubRepos(repos,
        process.env.GITHUB_ORG!,
        process.env.GITHUB_TOKEN!,
        process.env.AZURE_PERSONAL_ACCESS_TOKEN!,
        process.env.GITHUB_TEAM_NAME!,
    )
})()