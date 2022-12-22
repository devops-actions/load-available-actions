import {Octokit} from 'octokit'
import * as core from '@actions/core'
import {Repository} from './main'

export async function findAllRepos(
  client: Octokit,
  username: string,
  organization: string
): Promise<Repository[]> {
  // todo: switch between user and org

  const result: Repository[] = []

  let repos: any
  if (username) {
    repos = await client.paginate(client.rest.repos.listForUser, {
      username
    })
  }

  if (organization) {
    repos = await client.paginate(client.rest.repos.listForOrg, {
      org: organization
    })

    console.log(`Found [${organization}] as orgname parameter`)
  }
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

  return result
}
