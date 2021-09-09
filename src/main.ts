import * as core from '@actions/core'
import {Octokit} from 'octokit'

async function run(): Promise<void> {
  core.info('Starting')
  try {
    const PAT = core.getInput('PAT') // || process.env.PAT

    if (!PAT || PAT === '') {
      core.setFailed(
        "Parameter 'PAT' is required to load all private and internal actions from the organization"
      )
      return
    }

    const octokit = new Octokit({auth: PAT})

    try {
      const {
        data: {login}
      } = await octokit.rest.users.getAuthenticated()

      core.info(`Hello, ${login}`)
    } catch (error) {
      core.setFailed(
        'Could not authenticate with PAT. Please check that it is correct and that it has read access to the organization or user account.'
      )
      return
    }

    // let repos = findAllRepos(octokit)
    //findAllRepos(octokit, login)

    // const ms: string = core.getInput('milliseconds')
    // core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    // core.debug(new Date().toTimeString())
    // await wait(parseInt(ms, 10))
    // core.debug(new Date().toTimeString())

    // core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(`Error running action: : ${error.message}`)
  }

  // async function findAllRepos(
  //   client: Octokit,
  //   username: string
  // ): Promise<void> {
  //   const {data: repos} = await client.rest.repos.listForUser({
  //     username
  //   })

  //   core.info(`Hello, ${repos.length}`)
  //   return
  // }
}

run()
