# github-action-load-available-actions
Load all actions stored in the current organization, by calling the REST API with a Personal Access Token and find the `action.yml` or `action.yaml` file in the root of all repositories in the user account or organization.

The output is stored with the name `actions`, which can be retrieved in another action with `${{ steps.<step id>.outputs.actions }}`.

## Inputs
|Name|Description|
|---|---|
|user|The user to load actions from.|
|organization|The name of the organization to run on.|
|PAT|The Personal Access Token to use for the API calls.|

## Outputs
actions: a compressed json string with all the actions used in the workflows in the organization. The json is in the format:
``` json
[
    "lastUpdated": "20210818_1534"
    "actions": [
        {
            "repoName": "rajbos/actions-marketplace",
            "action: "action.name",
            "author": "action.author",
            "description": "action.description"
        },
        { etc }
    ]
]
```
Properties:
|Name|Description|
|----|-----------|
|lastUpdated|The date and time this action list was created.|
|actions|The list of actions available in the workflows in the organization. Format = YYYYMMDD_HHmm|

## Example usage
Minimal uses expression to use this action:

``` yaml
uses: rajbos/github-action-load-available-actions@main`
with: 
    PAT: ${{ secrets.GITHUB_TOKEN }}
```
Note: the default GITHUB_TOKEN might only have read access to the current repository, depending on the setup. Create a new token with `repo` scope to have full read-only access to the organization and use that as a parameter.  
- [] todo: check the scope and update above if needed

## Full example
This example shows how to use the action to get a json file with all the available actions in an organization. The json file is uploaded as an artefact in the third step.

|#|Name|Description|
|---|---|---|
|1|Load available actions|Run this action to load all actions available in an organization. Note the id of this step|
|2|Store json file|Output the json value from the output of the action in step 1, by using the id of step 1 in `${{ steps.<step id>.outputs.actions }}`|
|3|Upload result file as artefact|Upload the json file as an artefact|


``` yaml
jobs:
  load-all-used-actions:
    runs-on: ubuntu-latest
    steps: 
      - uses: rajbos/github-action-load-used-actions@main
        name: Load used actions
        with: 
          PAT: ${{ secrets.GITHUB_TOKEN }}
          user: rajbos
        id: load-actions

      - shell: pwsh        
        name: Store json file
        run: echo ${{ steps.load-actions.outputs.actions }} > 'actions.json'
            
      - name: Upload result file as artefact
        uses: actions/upload-artifact@v2
        with: 
          name: actions
          path: actions.json
```