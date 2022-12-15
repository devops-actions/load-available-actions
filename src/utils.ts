import moment from 'moment'
import {Octokit} from 'octokit'
import {Repository, Content} from './main'

export default function GetDateFormatted(date: Date): string {
  return moment(date).format('YYYYMMDD_HHmm')
}
async function fetchParentInfo(client: Octokit, repo: Repository) {
  const {data: repoinfo} = await client.rest.repos.get({
    owner: repo.owner,
    repo: repo.name
  })
  if (repoinfo.parent) {
    return repoinfo.parent.full_name
  }
}
export async function fetchYaml(
  repo: Repository,
  client: Octokit,
  pathElement: string
) {
  const result = new Content()
  const parentinfo = await fetchParentInfo(client, repo)
  const {data: yaml} = await client.rest.repos.getContent({
    owner: repo.owner,
    repo: repo.name,
    path: pathElement
  })
  if ('name' in yaml && 'download_url' in yaml) {
    result.name = yaml.name
    result.repo = repo.name
    result.forkedfrom = parentinfo
    result.downloadUrl = yaml.download_url || undefined
  }
  return result
}
