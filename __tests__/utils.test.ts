import {expect, test} from '@jest/globals'
import {GetDateFormatted} from '../src/utils'
import {parseYAML} from '../src/utils'
import {sanitize} from '../src/utils'

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
