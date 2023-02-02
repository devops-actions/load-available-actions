import {wait} from '../src/wait'
import {expect, test} from '@jest/globals'
import GetDateFormatted from '../src/utils'
<<<<<<< HEAD
=======
import {removeToken} from '../src/optionalActions'
>>>>>>> b1b2388 (Added test for trimming token)
import {Content} from '../src/main'
import assert from 'assert'
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

test(`Token trimming, valid input`, () => {
  let content = new Content()
  content = {
    downloadUrl: 'https://example.com/file.txt?token=abc123',
    name: '',
    owner: '',
    repo: '',
    author: '',
    description: '',
    forkedfrom: '',
    readme: ''
  }
  const expectedOutput = {
    downloadUrl: 'https://example.com/file.txt'
  }
  const result = removeToken(content)
  assert.deepEqual(result.downloadUrl, expectedOutput.downloadUrl)
})
