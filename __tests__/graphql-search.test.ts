import {expect, test, jest} from '@jest/globals'
import {shouldUseGraphQLSearch} from '../src/graphql-search'

test('shouldUseGraphQLSearch returns true by default', () => {
  // GraphQL should be enabled by default
  const result = shouldUseGraphQLSearch(false)
  expect(result).toBe(true)
})

test('shouldUseGraphQLSearch returns true for enterprise server by default', () => {
  // GraphQL should be enabled even for enterprise server
  const result = shouldUseGraphQLSearch(true)
  expect(result).toBe(true)
})

test('shouldUseGraphQLSearch returns false when DISABLE_GRAPHQL_SEARCH is set', () => {
  // Save original env
  const originalEnv = process.env.DISABLE_GRAPHQL_SEARCH

  // Set env to disable GraphQL
  process.env.DISABLE_GRAPHQL_SEARCH = 'true'

  const result = shouldUseGraphQLSearch(false)
  expect(result).toBe(false)

  // Restore original env
  if (originalEnv === undefined) {
    delete process.env.DISABLE_GRAPHQL_SEARCH
  } else {
    process.env.DISABLE_GRAPHQL_SEARCH = originalEnv
  }
})

test('shouldUseGraphQLSearch respects DISABLE_GRAPHQL_SEARCH for enterprise', () => {
  // Save original env
  const originalEnv = process.env.DISABLE_GRAPHQL_SEARCH

  // Set env to disable GraphQL
  process.env.DISABLE_GRAPHQL_SEARCH = 'true'

  const result = shouldUseGraphQLSearch(true)
  expect(result).toBe(false)

  // Restore original env
  if (originalEnv === undefined) {
    delete process.env.DISABLE_GRAPHQL_SEARCH
  } else {
    process.env.DISABLE_GRAPHQL_SEARCH = originalEnv
  }
})
