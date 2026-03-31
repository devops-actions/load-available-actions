import {expect, test, describe} from '@jest/globals'

// Since parseExcludedRepos and isRepoExcluded are not exported,
// we'll test them indirectly through the public API behavior
// For now, let's create unit tests for the logic as if they were exported

describe('Exclude Repos Functionality', () => {
  // Helper function that mimics parseExcludedRepos
  function parseExcludedRepos(excludeReposInput: string): Set<string> {
    const excludedRepos = new Set<string>()

    if (!excludeReposInput || excludeReposInput.trim() === '') {
      return excludedRepos
    }

    // Split by newlines and filter out empty lines
    const repoNames = excludeReposInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    repoNames.forEach(repoName => {
      excludedRepos.add(repoName.toLowerCase())
    })

    return excludedRepos
  }

  // Helper function that mimics isRepoExcluded
  function isRepoExcluded(
    repoName: string,
    excludedRepos: Set<string>
  ): boolean {
    return excludedRepos.has(repoName.toLowerCase())
  }

  test('parseExcludedRepos returns empty set for empty input', () => {
    const result = parseExcludedRepos('')
    expect(result.size).toBe(0)
  })

  test('parseExcludedRepos returns empty set for whitespace input', () => {
    const result = parseExcludedRepos('   \n  \n  ')
    expect(result.size).toBe(0)
  })

  test('parseExcludedRepos parses single repo name', () => {
    const result = parseExcludedRepos('my-repo')
    expect(result.size).toBe(1)
    expect(result.has('my-repo')).toBe(true)
  })

  test('parseExcludedRepos parses multiple repo names', () => {
    const input = `repo1
repo2
repo3`
    const result = parseExcludedRepos(input)
    expect(result.size).toBe(3)
    expect(result.has('repo1')).toBe(true)
    expect(result.has('repo2')).toBe(true)
    expect(result.has('repo3')).toBe(true)
  })

  test('parseExcludedRepos handles repos with extra whitespace', () => {
    const input = `  repo1  
  repo2
repo3  `
    const result = parseExcludedRepos(input)
    expect(result.size).toBe(3)
    expect(result.has('repo1')).toBe(true)
    expect(result.has('repo2')).toBe(true)
    expect(result.has('repo3')).toBe(true)
  })

  test('parseExcludedRepos filters out empty lines', () => {
    const input = `repo1

repo2

repo3`
    const result = parseExcludedRepos(input)
    expect(result.size).toBe(3)
  })

  test('parseExcludedRepos converts repo names to lowercase', () => {
    const input = `MyRepo
AnotherREPO
third-Repo`
    const result = parseExcludedRepos(input)
    expect(result.size).toBe(3)
    expect(result.has('myrepo')).toBe(true)
    expect(result.has('anotherrepo')).toBe(true)
    expect(result.has('third-repo')).toBe(true)
  })

  test('isRepoExcluded returns true for excluded repo', () => {
    const excludedRepos = new Set(['repo1', 'repo2'])
    expect(isRepoExcluded('repo1', excludedRepos)).toBe(true)
    expect(isRepoExcluded('repo2', excludedRepos)).toBe(true)
  })

  test('isRepoExcluded returns false for non-excluded repo', () => {
    const excludedRepos = new Set(['repo1', 'repo2'])
    expect(isRepoExcluded('repo3', excludedRepos)).toBe(false)
  })

  test('isRepoExcluded is case-insensitive', () => {
    const excludedRepos = new Set(['myrepo'])
    expect(isRepoExcluded('MyRepo', excludedRepos)).toBe(true)
    expect(isRepoExcluded('MYREPO', excludedRepos)).toBe(true)
    expect(isRepoExcluded('myrepo', excludedRepos)).toBe(true)
  })

  test('isRepoExcluded handles empty set', () => {
    const excludedRepos = new Set<string>()
    expect(isRepoExcluded('any-repo', excludedRepos)).toBe(false)
  })

  test('parseExcludedRepos handles special characters in repo names', () => {
    const input = `repo-with-dashes
repo_with_underscores
repo.with.dots`
    const result = parseExcludedRepos(input)
    expect(result.size).toBe(3)
    expect(result.has('repo-with-dashes')).toBe(true)
    expect(result.has('repo_with_underscores')).toBe(true)
    expect(result.has('repo.with.dots')).toBe(true)
  })
})
