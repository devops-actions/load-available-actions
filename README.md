# github-action-load-available-actions
Load all actions stored in the current organization, by calling the REST API with a Personal Access Token and find the `action.yml` file in all repositories in the user account or organization.

The output is stored with the name `actions`, which can be retrieved in another action with `${{ steps.<step id>.outputs.actions }}`.

## Inputs
|Name|Description|
|---|---|
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
|actions|The list of actions used in the workflows in the organization. Format = YYYYMMDD_HHmm|
