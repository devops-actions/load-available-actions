import * as core from '@actions/core'
import {Octokit} from 'octokit'

/**
 * Result from a code search (files)
 * Includes name, path, and repository information
 */
interface SearchResult {
  name: string
  path: string
  repository: {
    name: string
    owner: {
      login: string
    }
    fork: boolean
    archived: boolean
    visibility: string
  }
}

/**
 * Result from a repository search
 * Includes name and owner, but no path (repos don't have paths)
 */
interface RepoSearchResult {
  name: string
  owner: {
    login: string
  }
  fork: boolean
  archived: boolean
  visibility: string
}

interface GraphQLSearchResponse {
  search: {
    codeCount: number
    edges: Array<{
      node: {
        name: string
        path: string
        repository: {
          name: string
          owner: {
            login: string
          }
          isFork: boolean
          isArchived: boolean
          visibility: string
        }
      }
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

interface GraphQLRepoSearchResponse {
  search: {
    repositoryCount: number
    edges: Array<{
      node: {
        name: string
        owner: {
          login: string
        }
        isFork: boolean
        isArchived: boolean
        visibility: string
      }
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

/**
 * Execute a GraphQL code search query with pagination
 * This supports more than 1000 results by using cursor-based pagination
 */
export async function executeGraphQLCodeSearch(
  client: Octokit,
  searchQuery: string,
  maxResults: number = 10000
): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  let hasNextPage = true
  let cursor: string | null = null
  let resultsCount = 0

  core.info(`Starting GraphQL search with query: ${searchQuery}`)

  while (hasNextPage && resultsCount < maxResults) {
    try {
      // Build the GraphQL query
      const query = `
        query($searchQuery: String!, $cursor: String) {
          search(query: $searchQuery, type: CODE, first: 100, after: $cursor) {
            codeCount
            edges {
              node {
                ... on Blob {
                  name
                  path
                  repository {
                    name
                    owner {
                      login
                    }
                    isFork
                    isArchived
                    visibility
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `

      const variables = {
        searchQuery,
        cursor
      }

      core.debug(
        `GraphQL query - cursor: ${cursor}, results so far: ${resultsCount}`
      )

      const response: GraphQLSearchResponse = await client.graphql(
        query,
        variables
      )

      // Extract results from the response
      const edges = response.search.edges
      for (const edge of edges) {
        if (edge.node) {
          const node = edge.node
          results.push({
            name: node.name,
            path: node.path,
            repository: {
              name: node.repository.name,
              owner: {
                login: node.repository.owner.login
              },
              fork: node.repository.isFork,
              archived: node.repository.isArchived,
              visibility: node.repository.visibility
            }
          })
          resultsCount++
        }
      }

      hasNextPage = response.search.pageInfo.hasNextPage
      cursor = response.search.pageInfo.endCursor

      core.debug(
        `Fetched ${edges.length} results. Total: ${resultsCount}. Has next page: ${hasNextPage}`
      )

      // GitHub GraphQL API has rate limits - wait between requests
      if (hasNextPage) {
        await new Promise(r => setTimeout(r, 1000))
      }

      // Log progress for large result sets
      if (resultsCount >= 1000 && hasNextPage) {
        core.info(
          `Processing large result set: ${resultsCount} results so far. Total available: ${response.search.codeCount}. Continuing with cursor pagination.`
        )
      }
    } catch (error: any) {
      // Handle rate limiting
      if (
        error.message?.includes('rate limit') ||
        error.status === 403 ||
        error.status === 429
      ) {
        core.warning(
          `Rate limit hit during GraphQL search. Waiting before retry...`
        )
        await new Promise(r => setTimeout(r, 60000)) // Wait 1 minute
        continue
      }

      // For other errors, log and rethrow
      core.error(`GraphQL search error: ${error.message || error}`)
      throw error
    }
  }

  core.info(
    `GraphQL search completed. Total results: ${results.length} (max: ${maxResults})`
  )
  return results
}

/**
 * Execute a GraphQL repository search query
 * Used for finding forked repositories
 * Note: Repository results don't include a 'path' field (unlike code search results)
 */
export async function executeGraphQLRepoSearch(
  client: Octokit,
  searchQuery: string,
  maxResults: number = 10000
): Promise<RepoSearchResult[]> {
  const results: RepoSearchResult[] = []
  let hasNextPage = true
  let cursor: string | null = null
  let resultsCount = 0

  core.info(`Starting GraphQL repo search with query: ${searchQuery}`)

  while (hasNextPage && resultsCount < maxResults) {
    try {
      const query = `
        query($searchQuery: String!, $cursor: String) {
          search(query: $searchQuery, type: REPOSITORY, first: 100, after: $cursor) {
            repositoryCount
            edges {
              node {
                ... on Repository {
                  name
                  owner {
                    login
                  }
                  isFork
                  isArchived
                  visibility
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `

      const variables = {
        searchQuery,
        cursor
      }

      core.debug(
        `GraphQL repo query - cursor: ${cursor}, results so far: ${resultsCount}`
      )

      const response: GraphQLRepoSearchResponse = await client.graphql(
        query,
        variables
      )

      // Extract results from the response
      const edges = response.search.edges
      for (const edge of edges) {
        if (edge.node) {
          results.push({
            name: edge.node.name,
            owner: {
              login: edge.node.owner.login
            },
            fork: edge.node.isFork,
            archived: edge.node.isArchived,
            visibility: edge.node.visibility
          })
          resultsCount++
        }
      }

      hasNextPage = response.search.pageInfo.hasNextPage
      cursor = response.search.pageInfo.endCursor

      core.debug(
        `Fetched ${edges.length} repos. Total: ${resultsCount}. Has next page: ${hasNextPage}`
      )

      // Rate limiting
      if (hasNextPage) {
        await new Promise(r => setTimeout(r, 1000))
      }
    } catch (error: any) {
      if (
        error.message?.includes('rate limit') ||
        error.status === 403 ||
        error.status === 429
      ) {
        core.warning(
          `Rate limit hit during GraphQL repo search. Waiting before retry...`
        )
        await new Promise(r => setTimeout(r, 60000))
        continue
      }

      core.error(`GraphQL repo search error: ${error.message || error}`)
      throw error
    }
  }

  core.info(
    `GraphQL repo search completed. Total results: ${results.length} (max: ${maxResults})`
  )
  return results
}

/**
 * Check if we should use GraphQL search
 * GraphQL is available on GitHub.com and GHES 2.21+
 */
export function shouldUseGraphQLSearch(): boolean {
  // Use GraphQL everywhere unless explicitly disabled via env var
  const disableGraphQL = process.env.DISABLE_GRAPHQL_SEARCH === 'true'

  if (disableGraphQL) {
    core.info(
      'GraphQL search disabled via DISABLE_GRAPHQL_SEARCH environment variable'
    )
    return false
  }

  return true
}
