# load-available-actions

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/devops-actions/load-available-actions/badge)](https://api.securityscorecards.dev/projects/github.com/devops-actions/load-available-actions) [![OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/projects/6813/badge)](https://bestpractices.coreinfrastructure.org/projects/6813)

Load all actions and reusable workflows stored in the current organization, by calling the REST API with an Access Token and find the `action.yml` or `action.yaml` file in the root of all repositories in the user account or organization.

The output is stored in a file with the name `actions`, which can be retrieved in another action with `${{ steps.<step id>.outputs.outputFilename }}`.

We use the search API to find the following files in your repositories:

- action.yml
- action.yaml
- Dockerfile
- dockerfile
- .github/workflows/<workflow file>.yml

For the Dockerfiles we search for the required labels to identify them as actions.

For the reusable workflow a search is done if the workflow file contains '`workflow_call:`'

Note that the search API only supports up to a maximum of 1000 results, so we cannot return more actions than that at the moment.

## Finding Sub-Actions

When a repository contains an `action.yml` or `action.yaml` file in its root directory, this action will clone the repository and search for additional action files in subdirectories. This allows discovery of repositories that contain multiple actions in different folders.

**How it works:**
1. The action uses GitHub's search API to find action files across all repositories
2. When a root action file (`action.yml` or `action.yaml` in the repository root) is found, the repository is cloned
3. The action searches recursively for all `action.yml` and `action.yaml` files within the cloned repository
4. Sub-actions found in subdirectories are added to the output with their path information
5. Actions in test folders (e.g., `__tests__`, `test/`, `.test/`) are automatically excluded

**Example:** If a repository has the following structure:
```
my-action-repo/
├── action.yml           # Root action
├── docker/
│   └── action.yml       # Sub-action
└── .github/actions/
    └── helper/
        └── action.yml   # Sub-action
```

All three actions will be discovered and included in the output, with the `path` field indicating their location within the repository.

### Excluding Repositories from Cloning

When scanning for sub-actions, you can exclude specific repositories from being cloned. This is useful for skipping large repositories that you're not interested in, which can significantly reduce execution time.

**Usage:**
```yaml
- name: Load available actions
  uses: devops-actions/load-available-actions@v2
  with:
    PAT: ${{ secrets.PAT_TOKEN }}
    organization: your-org-name
    exclude-repos: |
      large-repo-1
      large-repo-2
      another-repo-to-skip
```

**Important notes:**
- Specify only the repository name, not the full `owner/repo` format
- One repository name per line
- Repository names are case-insensitive
- Only affects the cloning process for sub-action discovery
- Root actions from excluded repos are still included in the output

## Authentication

This action requires authentication to access the GitHub API. There are two methods available:

### 🔐 Recommended: GitHub App (Preferred for security)

Using a GitHub App to generate tokens is the **recommended approach** for better security:

- ✅ **More secure**: Tokens are short-lived (1 hour expiration) and not tied to user accounts
- ✅ **Better scalability**: Higher API rate limits based on organization size
- ✅ **Fine-grained permissions**: Control exactly what the app can access
- ✅ **No user dependencies**: Automation continues even when users leave the organization

To use this method, create a GitHub App with the required permissions (see below), then use the [actions/create-github-app-token](https://github.com/actions/create-github-app-token) action to generate a token. See the [example usage](#example-usage-with-github-app-recommended) below.

For more details on GitHub token types and security, see [GitHub Access Tokens explained](https://devopsjournal.io/blog/2022/01/03/GitHub-Tokens).

### Personal Access Token (PAT)

You can also use a Personal Access Token (PAT), though this is less secure for automation:

- ⚠️ Tokens are long-lived and tied to a user account
- ⚠️ If the user leaves the organization, automation breaks
- ⚠️ Broader access scope than typically needed

### Required Permissions

Regardless of the authentication method, the following permissions are needed:

- **Actions**: Read
- **Administration**: Read
- **Contents**: Read

**Note:** To discover private and internal repositories, the token must have access to those repositories. For Personal Access Tokens (PAT), use the `repo` scope. For GitHub Apps, ensure the app is installed with access to the repositories you want to scan.

## Inputs

| Name                      | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| user                      | The user to load actions from.                           |
| organization              | The name of the organization to run on.                  |
| PAT                       | The Access Token to use for the API calls.               |
| _removeToken (optional)_  | Removes token from remote url.                           |
| _fetchReadmes (optional_) | Adds readmes of repositories to json in a base64 format. |
| outputFilename (optional) | The name of the output file. Defaults to `actions.json`  |
| _exclude-repos (optional)_ | List of repository names to exclude from cloning (one per line). Use this to skip large repos that are not needed. |

## Outputs

- actions-file-path: path to the file containing a compressed json string with all the actions used in the workflows in the organization. The json is in the format:

```json
{
    "lastUpdated": "20210818_1534",
    "actions": [
        {
          "name": "Get Action Data",
          "repo": "actions-marketplace",
          "path": "subdirectory/path",
          "downloadUrl": "<raw url>?token=***",
          "author": "actions author",
          "description": "actions description",
          "using": "what is used to execute the action (node16, Docker, composite)",
          "readme": "base64 encoded readme",    #optional
          "isArchived": "true / false indicating if the repo is archived or not",
          "visibility": "public / private / internal",
          "isFork": "true / false indicating if the repo is a fork"
        }
    ],
    "workflows": [
      {
        "name": "The name from the workflow",
        "repo": "The name of the repo hosting the workflow",
        "isArchived": false,
        "downloadUrl": "<raw url>/.github/workflows/<workflow file>.yml",
        "visibility": "public / private / internal"
      }
    ]
}
```

Properties:
|Name|Description|
|----|-----------|
|lastUpdated|The date and time this action list was created. Format = YYYYMMDD_HHmm|
|actions|The list of actions available in the workflows in the organization.|
|workflows|The list of reusable workflows available in the repositories in the organization.|

Action Properties:
|Name|Description|
|----|-----------|
|name|The name of the action from the action.yml file|
|repo|The repository name containing the action|
|path|The subdirectory path within the repo (empty for root actions, or e.g., "docker" for sub-actions)|
|downloadUrl|The raw URL to download the action file|
|author|The author of the action|
|description|Description of what the action does|
|using|The runtime environment (node16, node20, docker, composite)|
|readme|Base64 encoded readme content (optional, if fetchReadmes is enabled)|
|isArchived|Whether the repository is archived|
|visibility|The repository visibility (public, private, or internal)|
|isFork|Whether the repository is a fork|

## Example usage

### Example usage with GitHub App (Recommended)

The recommended approach uses a GitHub App to generate a short-lived token:

```yaml
- name: Generate token
  id: generate-token
  uses: actions/create-github-app-token@v1
  with:
    app-id: ${{ secrets.APP_ID }}
    private-key: ${{ secrets.APP_PRIVATE_KEY }}

- name: Load available actions
  uses: devops-actions/load-available-actions@25cd9b38595c0526bb938c99f432d0a3e7365c3f # v2.1.16
  with:
    PAT: ${{ steps.generate-token.outputs.token }}
    organization: your-org-name
```

**Setup instructions:**

1. [Create a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app) with the required permissions (Actions: Read, Administration: Read, Contents: Read)
2. Install the app in your organization
3. Store the App ID in `APP_ID` secret
4. Store the private key in `APP_PRIVATE_KEY` secret

### Example usage with Personal Access Token

You can also use a Personal Access Token (less secure):

```yaml
uses: devops-actions/load-available-actions@25cd9b38595c0526bb938c99f432d0a3e7365c3f # v2.1.16
with:
  PAT: ${{ secrets.PAT_TOKEN }}
  organization: your-org-name
```

**Note:** The default `GITHUB_TOKEN` only has **read** access to the current repository, depending on the setup. For organization-wide access, you need either:

- A GitHub App token (recommended), or
- A Personal Access Token with `repo` scope

## Full example

This example shows how to use the action with a GitHub App token to get a json file with all the available actions in an organization. The json file is uploaded as an artifact in the third step.

| #   | Name                                                | Description                                                                                |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Generate GitHub App token                           | Create a short-lived token using a GitHub App (recommended for security)                   |
| 2   | Load available actions                              | Run this action to load all actions available in an organization. Note the id of this step |
| 3   | Upload result file as artifact for later inspection | Upload the json file as an artifact                                                        |

```yaml
jobs:
  load-all-available-actions:
    runs-on: ubuntu-latest
    steps:
      - name: Generate token
        id: generate-token
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}

      - name: Load available actions
        uses: devops-actions/load-available-actions@25cd9b38595c0526bb938c99f432d0a3e7365c3f # v2.1.16
        with:
          PAT: ${{ steps.generate-token.outputs.token }}
          organization: your-org-name
        id: load-actions

      - name: Upload result file as artifact
        uses: actions/upload-artifact@v3
        with:
          name: actions
          path: ${{ steps.load-actions.outputs.actions-file-path }}
```
