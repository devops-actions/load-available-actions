import * as core from '@actions/core'
import {Octokit} from 'octokit'

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
    core.info(`Found [${repos.length}] repositories`)

    // core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(`Error running action: : ${error.message}`)
  }

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
      const repository = new Repository(repos[num].name)
      result.push(repository)
    }

    return result
  }
}

run()

class Repository {
  name: string
  constructor(name: string) {
    this.name = name
  }
}
