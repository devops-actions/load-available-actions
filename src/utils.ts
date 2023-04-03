import moment from 'moment'
import string from 'string-sanitizer'
import YAML from 'yaml'

export default function GetDateFormatted(date: Date): string {
  return moment(date).format('YYYYMMDD_HHmm')
}

export function parseYAML(repo: string | undefined, content: string): any {
  try {
    const parsed = YAML.parse(content)
    const defaultValue = 'Undefined' // Default value when json field is not defined
    const name = parsed.name ? sanitize(parsed.name) : defaultValue
    const author = parsed.author ? sanitize(parsed.author) : defaultValue
    const description = parsed.description ? sanitize(parsed.description) : defaultValue

    return { name, author, description }
  } catch (error) {
    // this happens in https://github.com/gaurav-nelson/github-action-markdown-link-check/blob/9de9db77de3b29b650d2e2e99f0ee290f435214b/action.yml#L9
    // because of invalid yaml
    console.log(
      `Error parsing action file in repo [${repo}] with error:`
    )
    console.log(error)
    console.log(
      `The parsing error is informational, seaching for actions has continued`
    )
  }
}

function sanitize(value: string) {
  return string.sanitize.keepSpace(value)
}
