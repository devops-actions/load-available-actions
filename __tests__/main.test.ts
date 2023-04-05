import {wait} from '../src/wait'
import {expect, test} from '@jest/globals'
import GetDateFormatted from '../src/utils'
import {parseYAML} from '../src/utils'

test('throws invalid number', async () => {
  const input = parseInt('foo', 10)
  await expect(wait(input)).rejects.toThrow('milliseconds not a number')
})

test('wait 500 ms', async () => {
  const start = new Date()
  await wait(500)
  const end = new Date()
  var delta = Math.abs(end.getTime() - start.getTime())
  expect(delta).toBeGreaterThan(450)
})

test(`check dateformat string`, () => {
  const date = new Date(2021, 0, 16, 11, 43, 0, 0)
  const result = GetDateFormatted(date)

  expect(result).toHaveLength(13)
  expect(result).toMatch('20210116_1143')
})

test(`check parseYAML with normal strings`, () => {
  const content = `
name: 'test-name'
author: 'test-author'
description: 'testing'`
  const filePath = 'test'
  const result = parseYAML(filePath, 'test', content)

  expect(result.name).toBe('testname')
  expect(result.author).toBe('testauthor')
  expect(result.description).toBe('testing')
})

test(`check parseYAML with quoted strings`, () => {
  const content = `
name: 'test "name"'
author: 'test "author"'
description: 'testing "with quotes"'`
  const filePath = 'test'
  const result = parseYAML(filePath, 'test', content)

  expect(result.name).toBe('test name')
  expect(result.author).toBe('test author')
  expect(result.description).toBe('testing with quotes')
})