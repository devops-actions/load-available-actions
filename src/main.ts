import * as core from '@actions/core'
import {Octokit} from 'octokit'
import YAML from 'yaml'

async function run(): Promise<void> {
  core.info('Starting')
  try {
    const PAT = core.getInput('PAT') || process.env.PAT

    if (!PAT || PAT === '') {
      core.setFailed(
        "Parameter 'PAT' is required to load all private and internal actions from the organization"
      )
      return
    }

    // todo: handle auth issues:
    const octokit = new Octokit({auth: PAT})

    try {
      const user = await octokit.rest.users.getAuthenticated()

      core.info(`Hello, ${user.data.login}`)
    } catch (error) {
      core.setFailed(
        `Could not authenticate with PAT. Please check that it is correct and that it has [read access] to the organization or user account: ${error}`
      )
      return
    }

    const repos = await findAllRepos(octokit, 'rajbos')
    console.log(`Found [${repos.length}] repositories`)

    let actionFiles = await findAllActions(octokit, repos)
    // load the information in the files
    actionFiles = await enrichActionFiles(octokit, actionFiles)

    // output the json we want to output
    const output: {
      lastUpdated: string
      actions: Content[]
    } = {
      lastUpdated: new Date().toISOString(),
      actions: actionFiles
    }

    const json = JSON.stringify(output)
    core.setOutput('actions', JSON.stringify(json))
  } catch (error) {
    core.setFailed(`Error running action: : ${error.message}`)
  }

  //todo: move this function to a separate file, with the corresponding class definition
  async function findAllRepos(
    client: Octokit,
    username: string
  ): Promise<Repository[]> {
    // todo: switch between user and org

    // todo: add pagination
    const {data: repos} = await client.rest.repos.listForUser({
      username
    })

    core.info(`Found [${repos.length}] repositories`)

    // convert to an array of objects we can return
    const result: Repository[] = []

    // eslint disabled: no iterator available
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let num = 0; num < repos.length; num++) {
      const repo = repos[num]
      const repository = new Repository(repo.owner?.login || '', repo.name) //todo: handle for orgs
      result.push(repository)
    }

    return result
  }
}

class Repository {
  name: string
  owner: string
  constructor(owner: string, name: string) {
    this.name = name
    this.owner = owner
  }
}

class Content {
  name: string
  repo: string
  downloadUrl: string | null
  author: string
  description: string
  constructor(
    name: string,
    repo: string,
    downloadUrl: string | null,
    author: string,
    description: string
  ) {
    this.name = name
    this.repo = repo
    this.downloadUrl = downloadUrl
    this.author = author
    this.description = description
  }
}

async function findAllActions(
  client: Octokit,
  repos: Repository[]
): Promise<Content[]> {
  // create array
  const result: Content[] = []

  // search all repos for actions
  for (const repo of repos) {
    core.debug(`Searching repository for actions: ${repo.name}`)
    const content = await getActionFile(client, repo)
    if (content && content.name !== '') {
      core.info(
        `Found action file in repository: ${repo.name} with filename [${content.name}] download url [${content.downloadUrl}]`
      )
      // add to array
      result.push(content)
    }
  }

  console.log(`Found [${result.length}] actions in [${repos.length}] repos`)
  return result
}

async function getActionFile(
  client: Octokit,
  repo: Repository
): Promise<Content | null> {
  const result = new Content('', '', '', '', '') //todo: skip constructor setup

  // search for action.yml file in the root of the repo
  try {
    const {data: yml} = await client.rest.repos.getContent({
      owner: repo.owner,
      repo: repo.name,
      path: 'action.yml'
    })

    if ('name' in yml && 'download_url' in yml) {
      result.name = yml.name
      result.repo = repo.name
      result.downloadUrl = yml.download_url
    }
  } catch (error) {
    core.debug(`No action.yml file found in repository: ${repo.name}`)
  }

  if (result.name === '') {
    try {
      // search for the action.yaml, that is also allowed
      const {data: yaml} = await client.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.name,
        path: 'action.yaml'
      })

      if ('name' in yaml && 'download_url' in yaml) {
        result.name = yaml.name
        result.repo = repo.name
        result.downloadUrl = yaml.download_url
      }
    } catch (error) {
      core.debug(`No action.yaml file found in repository: ${repo.name}`)
    }
  }

  if (result.name === '') {
    core.info(`No actions found in repository: ${repo.name}`)
    return null
  }

  return result
}

async function enrichActionFiles(
  client: Octokit,
  actionFiles: Content[]
): Promise<Content[]> {
  for (const action of actionFiles) {
    // download the file in it and parse it
    if (action.downloadUrl !== null) {
      const {data: content} = await client.request({url: action.downloadUrl})
      // parse the yaml
      const parsed = YAML.parse(content)
      action.name = parsed.name
      action.author = parsed.author
      action.description = parsed.description
    }
  }
  return actionFiles
}

run()
