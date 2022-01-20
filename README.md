# ADO -> GHE migration helper

The workflow in this repo will migrate the repos from an ADO project to GitHub.

## Prerequisites
##### Secrets
* `ADO_IMPORT_PAT` - Azure DevOps PAT with `read` access for repos
* `GH_PAT_FOR_IMPORT` - GitHub PAT with full `repo` access

## Usage
Run the workflow in `.github/workflows/import.yml`; provide the URL to the source ADO org and the name of the source project.

The script will get a list of all the repos in the source project, and will import them to the current GitHub org unless a repo with a matching name already exists.
