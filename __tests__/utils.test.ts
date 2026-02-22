// @ts-expect-error - Mock @actions/core for testing (jest global not available in TS)
jest.mock('@actions/core')

import {expect, test} from '@jest/globals'
import {GetDateFormatted} from '../src/utils'
import {parseYAML} from '../src/utils'
import {sanitize} from '../src/utils'
import {isInTestFolder} from '../src/utils'

test('date parsing', () => {
  const date = new Date(2021, 0, 16, 11, 43, 0, 0)
  const result = GetDateFormatted(date)

  expect(result).toHaveLength(13)
  expect(result).toMatch('20210116_1143')
})

test(`check parseYAML with normal strings`, () => {
  const content = `
  name: 'test-name'
  author: 'test-author'
  description: 'testing'
  runs:\n    using: 'test'`
  const filePath = 'test'
  const result = parseYAML(filePath, 'test', content)

  expect(result.name).toBe('testname')
  expect(result.author).toBe('testauthor')
  expect(result.description).toBe('testing')
  expect(result.using).toBe('test')
  expect(result.isWorkflow).toBe(false)
})

test(`check parseYAML with quoted strings`, () => {
  const content = `
  name: 'test "name"'
  author: 'test "author"'
  description: 'testing "with quotes"'
  runs:\n    using: 'testwithquote"'
  `

  const filePath = 'test'
  const result = parseYAML(filePath, 'test', content)

  expect(result.name).toBe('test name')
  expect(result.author).toBe('test author')
  expect(result.description).toBe('testing with quotes')
  expect(result.using).toBe('testwithquote')
  expect(result.isWorkflow).toBe(false)
})

test(`check parseYAML detects workflow definition with 'on' trigger`, () => {
  const content = `
  name: 'test workflow'
  on:
    push:
      branches: [ main ]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3`
  const filePath = 'test/action.yml'
  const result = parseYAML(filePath, 'test', content)

  expect(result.isWorkflow).toBe(true)
  expect(result.name).toBe('Undefined')
  expect(result.author).toBe('Undefined')
  expect(result.description).toBe('Undefined')
})

test(`check parseYAML detects workflow with 'on' as object`, () => {
  const content = `
  name: 'CI Workflow'
  on:
    pull_request:
    push:
      branches:
        - main
  jobs:
    test:
      runs-on: ubuntu-latest`
  const filePath = '.github/workflows/ci.yml'
  const result = parseYAML(filePath, 'test-repo', content)

  expect(result.isWorkflow).toBe(true)
})

test(`Check sanitization`, () => {
  const value = 'Abc$%#6- ZZpp'
  const cleaned = sanitize(value)
  expect(cleaned).toBe('Abc6 ZZpp')
})

test('isInTestFolder detects __tests__ directories', () => {
  expect(
    isInTestFolder(
      'toolkit/packages/artifact/__tests__/ci-test-action/action.yml'
    )
  ).toBe(true)
  expect(isInTestFolder('path/to/__tests__/action.yml')).toBe(true)
})

test('isInTestFolder detects __fixtures__ directories', () => {
  expect(
    isInTestFolder('toolkit/packages/cache/__tests__/__fixtures__/action.yml')
  ).toBe(true)
  expect(isInTestFolder('some/__fixtures__/action.yml')).toBe(true)
})

test('isInTestFolder detects test directories', () => {
  expect(isInTestFolder('src/test/action.yml')).toBe(true)
  expect(isInTestFolder('src/tests/action.yml')).toBe(true)
})

test('isInTestFolder detects .test directories', () => {
  expect(isInTestFolder('src/.test/action.yml')).toBe(true)
})

test('isInTestFolder detects test- prefixed directories', () => {
  expect(isInTestFolder('src/test-utils/action.yml')).toBe(true)
})

test('isInTestFolder detects -test suffixed directories', () => {
  expect(isInTestFolder('src/integration-test/action.yml')).toBe(true)
})

test('isInTestFolder does not flag normal paths', () => {
  expect(isInTestFolder('action.yml')).toBe(false)
  expect(isInTestFolder('src/action.yml')).toBe(false)
  expect(isInTestFolder('.github/actions/my-action/action.yml')).toBe(false)
  expect(isInTestFolder('packages/core/action.yml')).toBe(false)
})

test('isInTestFolder does not flag paths with test in directory names', () => {
  // Directories that contain 'test' but are not test directories
  expect(isInTestFolder('attestation/action.yml')).toBe(false)
  expect(isInTestFolder('latest/action.yml')).toBe(false)
  expect(isInTestFolder('contest-winner/action.yml')).toBe(false)
  expect(isInTestFolder('my-test-directory/action.yml')).toBe(false)
  expect(isInTestFolder('important-test-data/action.yml')).toBe(false)
})

test('isInTestFolder handles Windows-style paths', () => {
  expect(
    isInTestFolder('toolkit\\packages\\artifact\\__tests__\\action.yml')
  ).toBe(true)
  expect(isInTestFolder('src\\test\\action.yml')).toBe(true)
})

test('isInTestFolder correctly identifies sub-action paths', () => {
  // Sub-actions in valid directories should not be flagged as test folders
  expect(isInTestFolder('.github/actions/sub-action/action.yml')).toBe(false)
  expect(isInTestFolder('actions/my-action/action.yml')).toBe(false)
  expect(isInTestFolder('src/actions/helper/action.yml')).toBe(false)
  expect(isInTestFolder('docker/action/action.yml')).toBe(false)

  // But sub-actions in test folders should still be flagged
  expect(isInTestFolder('.github/actions/__tests__/mock/action.yml')).toBe(true)
  expect(isInTestFolder('actions/test/action.yml')).toBe(true)
})

test('isInTestFolder correctly handles github/codeql-action repository structure', () => {
  // The github/codeql-action repository contains multiple actions in subfolders
  // These are the actual paths from that repository (as of 2024)

  // Root action and sub-actions in main directories should be valid
  expect(isInTestFolder('action.yml')).toBe(false)
  expect(isInTestFolder('analyze/action.yml')).toBe(false)
  expect(isInTestFolder('autobuild/action.yml')).toBe(false)
  expect(isInTestFolder('init/action.yml')).toBe(false)
  expect(isInTestFolder('resolve-environment/action.yml')).toBe(false)
  expect(isInTestFolder('setup-codeql/action.yml')).toBe(false)
  expect(isInTestFolder('start-proxy/action.yml')).toBe(false)
  expect(isInTestFolder('upload-sarif/action.yml')).toBe(false)

  // Actions in .github/actions/ that are NOT in test folders should be valid
  expect(isInTestFolder('.github/actions/release-initialise/action.yml')).toBe(
    false
  )
  expect(isInTestFolder('.github/actions/check-sarif/action.yml')).toBe(false)
  expect(isInTestFolder('.github/actions/update-bundle/action.yml')).toBe(false)

  // Actions in .github/actions/ with 'test' in the path should be filtered
  // This one has 'test' as a complete directory segment, so it should be filtered
  expect(isInTestFolder('.github/actions/prepare-test/action.yml')).toBe(true)
  expect(isInTestFolder('.github/actions/query-filter-test/action.yml')).toBe(
    true
  )
})
