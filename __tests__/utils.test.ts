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

test(`Check sanitization`, () => {
    const value = "Abc$%#6- ZZpp"
    const cleaned = sanitize(value)
    expect(cleaned).toBe("Abc6 ZZpp")
})