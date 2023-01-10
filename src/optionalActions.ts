import {Octokit} from 'octokit'
import * as core from '@actions/core'

export async function getReadmeContent(
  client: Octokit,
  repo: string,
  owner: string
): Promise<string | undefined> {
  try {
    const {data: readme} = await client.rest.repos.getContent({
      owner,
      repo,
      path: 'README.md'
    })
    return readme.content
  } catch (error) {
    core.debug(`No readme file found in repository: ${repo}`)
  }
}