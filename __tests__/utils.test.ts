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
  description: 'email@testing.com-+-'
  runs:\n    using: 'test'`
    const filePath = 'test'
    const result = parseYAML(filePath, 'test', content)
  
    expect(result.name).toBe('test-name')
    expect(result.author).toBe('test-author')
    expect(result.description).toBe('email@testing.com-+-')
    expect(result.using).toBe('test')
  })
  
test(`check parseYAML with greater/less than`, () => {
    const content = `
  name: '<test script="injection">'
  author: '<injection test in author>'
  description: '<injection test in description>'
  runs:\n    using: 'testwithquote"'
  `

    const filePath = 'test'
    const result = parseYAML(filePath, 'test', content)
  
    expect(result.name).toBe('&#60;test script="injection"&#62;')
    expect(result.author).toBe('&#60;injection test in author&#62;')
    expect(result.description).toBe('&#60;injection test in description&#62;')
    expect(result.using).toBe('testwithquote')
  })

test(`Check sanitization`, () => {
    const value = "Abc$%#6- ZZpp"
    const cleaned = sanitize(value)
    expect(cleaned).toBe("Abc6 ZZpp")
})