# Azure DevOps to GitHub migration helper

The workflow in this repo will migrate the repos from an ADO project to GitHub.

## Prerequisites
##### Secrets
The following secrets should be set so that the workflow has access to them.
* `ADO_IMPORT_PAT` - Azure DevOps PAT with `read` access for repos
* `GH_IMPORT_PAT` - GitHub PAT with full `repo` access

## Usage
Run the workflow in `.github/workflows/import.yml`; provide the URL to the source ADO org and the name of the source project. 
By default, the workflow will use the org it's running in as the importation target, but this can be overridden when running the workflow.

![run workflow interface](img/run_workflow.png)

The script will get a list of all the repos in the source project, and will import them to the current GitHub org unless a repo with a matching name already exists.
