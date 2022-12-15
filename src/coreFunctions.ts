import {Octokit} from 'octokit'
import * as core from '@actions/core'
import {Repository} from './main'

export async function findAllRepos(
  client: Octokit,
  username: string,
  organization: string
): Promise<Repository[]> {
  // todo: switch between user and org

  // convert to an array of objects we can return
  const result: Repository[] = []

  if (username) {
    const repos = await client.paginate(client.rest.repos.listForUser, {
      username
    })

    core.info(`Found [${repos.length}] repositories`)

    // eslint disabled: no iterator available
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let num = 0; num < repos.length; num++) {
      const repo = repos[num]
      const repository = new Repository(
        repo.owner?.login || '',
        repo.name,
        repo.visibility ?? ''
      ) //todo: handle for orgs
      result.push(repository)
    }
  }

  if (organization) {
    const repos = await client.paginate(client.rest.repos.listForOrg, {
      org: organization
    })

    console.log(`Found [${organization}] as orgname parameter`)
    core.info(`Found [${repos.length}] repositories`)

    // eslint disabled: no iterator available
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let num = 0; num < repos.length; num++) {
      const repo = repos[num]
      const repository = new Repository(
        repo.owner?.login || '',
        repo.name,
        repo.visibility ?? ''
      ) //todo: handle for orgs
      result.push(repository)
    }
  }

  return result
}
