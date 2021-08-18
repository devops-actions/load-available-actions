# example calls:
# .\load-used-actions.ps1 -orgName "rajbos-actions" -userName "xxx" -PAT $env:GitHubPAT -$marketplaceRepo "rajbos/actions-marketplace"
param (
    [string] $orgName,
    [string] $userName,
    [string] $PAT
)

# pull in central calls library
. $PSScriptRoot\github-calls.ps1
. $PSScriptRoot\generic.ps1

Write-Host "We're running with these parameters:"
Write-Host " PAT.Length: [$($PAT.Length)]"
Write-Host " orgName: [$orgName]"

if ($null -eq $userName -or "" -eq $userName) {
    $userName = $env:GITHUB_ACTOR
    if ($null -eq $userName -or "" -eq $userName) {
        # we still need to provide a value for $userName for calls to the api
        $userName = "x"
    }
}

Write-Host " userName: [$userName]"

function  GetActionsFromWorkflow {
    param (
        [string] $workflow,
        [string] $workflowFileName,
        [string] $repo
    )

    # parse the workflow file and extract the actions used in it
    $parsedYaml = ConvertFrom-Yaml $workflow

    # create hastable
    $actions = @()

    # go through the parsed yaml
    foreach ($job in $parsedYaml["jobs"].GetEnumerator()) {
        Write-Host "  Job found: [$($job.Key)]"
        $steps=$job.Value.Item("steps")
        foreach ($step in $steps) {
            $uses=$step.Item("uses")
            if ($null -ne $uses) {
                Write-Host "   Found action used: [$uses]"
                $actionLink = $uses.Split("@")[0]

                $data = [PSCustomObject]@{
                    actionLink = $actionLink
                    workflowFileName = $workflowFileName
                    repo = $repo
                }

                $actions += $data
            }
        }
    }

    return $actions
}

function LoadAllActionsFromRepos {
    param (
        [object] $repos,
        [string] $userName,
        [string] $PAT,
        [string] $marketplaceRepo
    )

    # create hashtable
    $reposWithActions = @()

    foreach ($repo in $repos) {
        # add empty line for logs readability
        Write-Host ""

        # check with this call if the repo has a file in the root named 'action.yaml'
        # GET https://api.github.com/repos/rajbos/actions-testing/contents/action.yml
        # https://api.github.com/repos/${$repo.full_name}/contents/action.yml

        #todo: check for action.yaml as well
        $hasActionFile  = GetFileAvailable -repository $repo.full_name -fileName 'action.yml' -PAT $PAT -userName $userName
        
        if ($hasActionFile) {
            Write-Host "Found action.yml in repository [$($repo.full_name)], loading the file contents"
                                    
            $fileInfo = GetFileInfo -repository $repo.full_name -fileName 'action.yml' -PAT $PAT -userName $userName

            $repoInfo = GetRawFile -url $fileInfo.download_url
            if ($repoInfo) {
                Write-Host "Loaded action.yml information"     
                
                $parsedYaml = ConvertFrom-Yaml $repoInfo

                $repoData = [PSCustomObject]@{
                    repoName = $repo.full_name
                    action = [PSCustomObject]@{
                        name = $parsedYaml["name"]
                        author = $parsedYaml["author"]
                        description = $parsedYaml["description"]
                    }
                }

                $reposWithActions += $repoData
            } 
            else {
                Write-Host "Cannot load action.yml"
            }
        }
        else {
            Write-Host "Skipping repository [$($repo.full_name)] since it has no actions file in the root"
        }
    }

    Write-Host "Found [$($reposWithActions.Count)] repositories with actions"
    return [PSCustomObject]@{
        actions = $reposWithActions
        lastUpdated = (Get-Date -AsUTC -UFormat '+%Y%m%d_%H%M')
    }
}

function main() {

    # get all repos in an org
    $repos = FindAllRepos -orgName $orgName -userName $userName -PAT $PAT

    # get actions from the workflows in the repos
    $actionsFound = LoadAllActionsFromRepos -repos $repos -userName $userName -PAT $PAT -marketplaceRepo $marketplaceRepo
    Write-Host "Found [$($actionsFound.actions.Count)] actions"
    
}

$actions = main
return $actions