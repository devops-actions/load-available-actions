import * as core from '@actions/core'
import {Octokit} from 'octokit'
import YAML from 'yaml'
import GetDateFormatted from './utils'
import dotenv from 'dotenv'
import {removeToken, getReadmeContent} from './optionalActions'
// always import the config
dotenv.config()

const getInputOrEnv = (input: string) =>
  core.getInput(input) || process.env.input || ''
//Optional values
const removeTokenSetting = getInputOrEnv('removeToken')
const fetchReadmesSetting = getInputOrEnv('fetchReadmes')

async function run(): Promise<void> {
  core.info('Starting')
  try {
    const PAT = getInputOrEnv('PAT')
    const user = getInputOrEnv('user')
    const organization = getInputOrEnv('organization')
    const baseUrl = process.env.GITHUB_API_URL || 'https://api.github.com'
    const isEnterpriseServer = baseUrl !== 'https://api.github.com'

    if (!PAT) {
      core.setFailed(
        "Parameter 'PAT' is required to load all actions from the organization or user account"
      )
      return
    }

    if (user === '' && organization === '') {
      core.setFailed(
        "Either parameter 'user' or 'organization' is required to load all actions from it. Please provide one of them."
      )
      return
    }

    const octokit = new Octokit({
      auth: PAT,
      baseUrl: baseUrl
    })

    try {
      // this call fails from an app, so we need a better way to validate this
      //const currentUser = await octokit.rest.users.getAuthenticated()
      //core.info(`Hello, ${currentUser.data.login}`)
    } catch (error) {
      core.setFailed(
        `Could not authenticate with PAT. Please check that it is correct and that it has [read access] to the organization or user account: ${error}`
      )
      return
    }

    let actionFiles = await getAllActions(octokit,  user, organization, isEnterpriseServer)
    // load the information in the files
    actionFiles = await enrichActionFiles(octokit, actionFiles)

    // output the json we want to output
    const output: {
      lastUpdated: string
      organization: string
      user: string
      actions: Content[]
    } = {
      lastUpdated: GetDateFormatted(new Date()),
      actions: actionFiles,
      organization,
      user
    }

    const json = JSON.stringify(output)
    core.setOutput('actions', json)
  } catch (error) {
    core.setFailed(`Error running action: : ${error.message}`)
  }
}

export class Repository {
  name: string
  owner: string
  visibility: string
  constructor(owner: string, name: string, visibility: string) {
    this.name = name
    this.owner = owner
    this.visibility = visibility
  }
}

export class Content {
  name: string | undefined
  owner: string | undefined
  repo: string | undefined
  downloadUrl: string | undefined
  author: string | undefined
  description: string | undefined
  forkedfrom: string | undefined
  readme: string | undefined
}

async function enrichActionFiles(
  client: Octokit,
  actionFiles: Content[]
): Promise<Content[]> {
  for (const action of actionFiles) {
    core.debug(`Enrich : ${action.downloadUrl}`)
    // download the file in it and parse it
    if (action.downloadUrl !== null) {
      const { data: content } = await client.request({ url: action.downloadUrl })

      // try to parse the yaml
      try {
        const parsed = YAML.parse(content)
        const defaultValue = "Undefined" // Default value when json field is not defined
        action.name = parsed.name ? parsed.name : defaultValue
        action.author = parsed.author ? parsed.author : defaultValue
        action.description = parsed.description ? parsed.description : defaultValue
        action.downloadUrl = action.downloadUrl.split('?')[0] //Remove the token in json
      } catch (error) {
        // this happens in https://github.com/gaurav-nelson/github-action-markdown-link-check/blob/9de9db77de3b29b650d2e2e99f0ee290f435214b/action.yml#L9
        // because of invalid yaml
        console.log(
          `Error parsing action file in repo [${action.repo}] with error:`
        )
        console.log(error)
        console.log(
          `The parsing error is informational, seaching for actions has continued`
        )
      }
    }
  }
  return actionFiles
}

async function getAllActions(
  client: Octokit,
  username: string,
  organization: string,
  isEnterpriseServer: boolean
): Promise<Content[]> {
  const actions: Content[] = []

  
  var searchQuery = '+filename:action+language:YAML';
  if (username) {
    core.info(`Search for action files of the user [ ${username} ]`)
    searchQuery = searchQuery.concat('+user:', username)
  }

  if (organization !== '') {
    core.info(`Search for action files under the organization [ ${organization} ]`)
    searchQuery = searchQuery.concat('+org:', organization)
  }

  core.debug(`searchQuery : ${searchQuery}`)

  const searchResult = await client.paginate(client.rest.search.code, {
    q: searchQuery
  })

  if(searchResult){
    for (let index = 0; index <searchResult.length; index++) {
      const result = new Content()
      var fileName = searchResult[index].name; 
      var element = searchResult[index].path;
      var repoName = searchResult[index].repository.name;
      var repoOwner = searchResult[index].repository.owner.login;

      // Push file to action list if filename matches action.yaml or action.yml
      // Search result will contains list of files matching action files ex: reposyncer_action.yml
      if(fileName == 'action.yaml'|| fileName == 'action.yml'){
        core.info(`Found action in ${repoName}/${element}`)
        // Get Forked from Info for the repo
        const { data: repoinfo } = await client.rest.repos.get({
          owner: repoOwner,
          repo: repoName
        })
        let parentinfo = ''
        if (repoinfo.parent?.full_name) {
          parentinfo = repoinfo.parent.full_name
        }

        // Get File content
        const { data: yaml } = await client.rest.repos.getContent({
          owner: repoOwner,
          repo: repoName,
          path: element
        })
        if ('name' in yaml && 'download_url' in yaml) {
          result.name = yaml.name
          result.repo = repoName
          result.forkedfrom = parentinfo
          if (yaml.download_url !== null) {
            result.downloadUrl = yaml.download_url
          }
        }

        actions.push(result)
      }
    }
  }
  return actions
}

run()

