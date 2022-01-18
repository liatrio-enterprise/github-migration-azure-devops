import {Octokit} from "@octokit/core";

import * as nodeApi from 'azure-devops-node-api';
import * as CoreApi from 'azure-devops-node-api/CoreApi';
import * as GitApi from 'azure-devops-node-api/GitApi';

async function run() {
    require('dotenv').config()

    let adoOrgURL: string = process.env.ADO_ORG!;
    let adoToken: string = process.env.AZURE_PERSONAL_ACCESS_TOKEN!;

    let authHandler = nodeApi.getPersonalAccessTokenHandler(adoToken);
    let connection = new nodeApi.WebApi(adoOrgURL, authHandler);

    const projectName: string = "kingfisher-demo"
    const coreApiObject: CoreApi.CoreApi = await connection.getCoreApi()
    const gitApiObject: GitApi.GitApi = await connection.getGitApi()

    const project = coreApiObject.getProject(projectName)

    let repos = gitApiObject.getRepositories(projectName)

    for(const repo of await repos){
        console.log(`name: ${repo.name}`)
        console.log(`remoteUrl: ${repo.remoteUrl}`)
        console.log(`projectName: ${repo.project?.name}`)
        console.log(`******************************`)

    }
}

let promise = run();