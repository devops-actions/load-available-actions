import moment from 'moment'
import {Octokit} from 'octokit'
import {Repository, Content} from './main'

export default function GetDateFormatted(date: Date): string {
  return moment(date).format('YYYYMMDD_HHmm')
}
<<<<<<< HEAD
async function fetchParentInfo(repo: Repository, client: Octokit) {
=======
async function fetchParentInfo(client: Octokit, repo: Repository) {
>>>>>>> 2c9d7bf (Moved search to utils; removed more duplicate code)
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
<<<<<<< HEAD
  const parentinfo = await fetchParentInfo(repo, client)
=======
  const parentinfo = await fetchParentInfo(client, repo)
>>>>>>> 2c9d7bf (Moved search to utils; removed more duplicate code)
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
<<<<<<< HEAD

export async function searchForActionYaml(repo: Repository, client: Octokit) {
  let result: any
  const searchQuery =
    '+filename:action+language:YAML+repo:' + repo.owner + '/' + repo.name

  const searchResultforRepository = await client.request('GET /search/code', {
    q: searchQuery
  })

  if (Object.keys(searchResultforRepository.data.items).length > 0) {
    for (
      let index = 0;
      index < Object.keys(searchResultforRepository.data.items).length;
      index++
    ) {
      const pathElement = searchResultforRepository.data.items[index].path
      result = fetchYaml(repo, client, pathElement)
    }
    return result
  }
}
=======
>>>>>>> 2c9d7bf (Moved search to utils; removed more duplicate code)
