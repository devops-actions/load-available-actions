import * as core from '@actions/core'
import {Octokit} from 'octokit'

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
    visibility?: string
  }
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

      // Check if we've hit the 1000 result limit for a single query
      // This shouldn't happen with cursor pagination, but we check anyway
      if (resultsCount >= 1000 && hasNextPage) {
        core.warning(
          `Hit 1000 result limit with cursor pagination. Total count from API: ${response.search.codeCount}. This may indicate we need date-based query splitting.`
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
 */
export async function executeGraphQLRepoSearch(
  client: Octokit,
  searchQuery: string,
  maxResults: number = 10000
): Promise<any[]> {
  const results: any[] = []
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

      const response: any = await client.graphql(query, variables)

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
 * Check if we should use GraphQL search (not available on some GHES versions)
 */
export function shouldUseGraphQLSearch(isEnterpriseServer: boolean): boolean {
  // GraphQL is available on GitHub.com and GHES 2.21+
  // For now, we'll use it everywhere unless explicitly disabled via env var
  const disableGraphQL = process.env.DISABLE_GRAPHQL_SEARCH === 'true'

  if (disableGraphQL) {
    core.info(
      'GraphQL search disabled via DISABLE_GRAPHQL_SEARCH environment variable'
    )
    return false
  }

  return true
}
