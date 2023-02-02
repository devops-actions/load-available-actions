import {Octokit} from 'octokit'
import * as core from '@actions/core'

<<<<<<< HEAD
<<<<<<< HEAD
=======
export const removeToken = (content: Content) => {
  if (content && content.downloadUrl) {
    content.downloadUrl = content.downloadUrl.replace(/\?(.*)/, '')
  }
  return content
}

>>>>>>> 0f6c4eb (Moved optional actions; object checking fix; build main.js)
=======
>>>>>>> 83d3e8c (Rebase)
export async function getReadmeContent(
  client: Octokit,
  repo: string,
  owner: string
): Promise<string | undefined> {
  try {
<<<<<<< HEAD
<<<<<<< HEAD
    const {data: readme} = await client.rest.repos.getContent({
      owner,
      repo,
=======
    const readme: any = await client.rest.repos.getContent({
      owner: repo.owner,
      repo: repo.name,
>>>>>>> 599133d (Adjustmest for tests)
=======
    const {data: readme} = await client.rest.repos.getContent({
      owner,
      repo,
>>>>>>> 83d3e8c (Rebase)
      path: 'README.md'
    })

    return readme.content
  } catch (error) {
    core.debug(`No readme file found in repository: ${repo}`)
  }
}
