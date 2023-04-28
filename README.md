# load-available-actions

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/devops-actions/load-available-actions/badge)](https://api.securityscorecards.dev/projects/github.com/devops-actions/load-available-actions) [![OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/projects/6813/badge)](https://bestpractices.coreinfrastructure.org/projects/6813)

Load all actions stored in the current organization, by calling the REST API with an  Access Token and find the `action.yml` or `action.yaml` file in the root of all repositories in the user account or organization.

The output is stored in a file with the name `actions`, which can be retrieved in another action with `${{ steps.<step id>.outputs.outputFilename }}`.

We use the search api to find the following files in your repositories:
- action.yml
- action.yaml
- Dockerfile
- dockerfile
For the Dockerfiles we search for the required labels to identify them as actions.

Note that the search API only supports up to a maximum of 1000 results, so we cannot return more actions than that at the moment.

## Inputs
|Name|Description|
|---|---|
|user|The user to load actions from.|
|organization|The name of the organization to run on.|
|PAT|The Access Token to use for the API calls.|
|_removeToken (optional)_|Removes token from remote url.|
|_fetchReadmes (optional_)|Adds readmes of repositories to json in a base64 format.|
|outputFilename (optional)|The name of the output file. Defaults to `actions.json`|

### Scopes needed for the access token
Repo permissions needed for the access token:
- Actions: Read
- Administration: Read
- Contents: Read

## Outputs
- actions-file-path: path to the file containing a compressed json string with all the actions used in the workflows in the organization. The json is in the format:
``` 
{
    "lastUpdated": "20210818_1534",
    "actions": [
        {
          "name": "Get Action Data",
          "repo": "actions-marketplace",
          "downloadUrl": "<raw url>?token=***",
          "author": "actions author",
          "description": "actions description",
          "readme": "base64 encoded readme"    #optional
        }
    ]
}
```
Properties:
|Name|Description|
|----|-----------|
|lastUpdated|The date and time this action list was created. Format = YYYYMMDD_HHmm|
|actions|The list of actions available in the workflows in the organization.|

## Example usage
Minimal uses expression to use this action:

``` yaml
uses: devops-actions/load-available-actions@6ff0cdddb24a91bfe889faa29e8d7a97e521f2c3 # v1.2.23`
with: 
    PAT: ${{ secrets.GITHUB_TOKEN }}
```

Note: the default GITHUB_TOKEN might only has **read** access to the current repository, depending on the setup. Create a new token with `repo` scope to have full read-only access to the organization and use that as a parameter.

## Full example
This example shows how to use the action to get a json file with all the available actions in an organization. The json file is uploaded as an artefact in the third step.

|#|Name|Description|
|---|---|---|
|1|Load available actions|Run this action to load all actions available in an organization. Note the id of this step|
|2|Upload result file as artefact for later inspection|Upload the json file as an artefact|

``` yaml
jobs:
  load-all-available-actions:
    runs-on: ubuntu-latest
    steps: 
      - uses: devops-actions/load-available-actions@v2.0.0
        name: Load available actions
        with: 
          PAT: ${{ secrets.GITHUB_TOKEN }}
          user: rajbos
        id: load-actions
            
      - name: Upload result file as artefact
        uses: actions/upload-artifact@v3
        with: 
          name: actions
          path: ${{ steps.load-actions.outputs.actions-file-path }}
```
