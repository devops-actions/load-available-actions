import * as core from '@actions/core'
import {execSync} from 'child_process'
import moment from 'moment'
import string from 'string-sanitizer'
import YAML from 'yaml'
import {promisify} from 'util'
import fs from 'fs'

export interface ParseYAMLResult {
  name: string
  author: string
  description: string
  using: string
  isWorkflow: boolean
}

export function GetDateFormatted(date: Date): string {
  return moment(date).format('YYYYMMDD_HHmm')
}

/**
 * Check if a file path is in a test folder
 * @param filePath The path to check
 * @returns true if the path is in a test folder, false otherwise
 */
export function isInTestFolder(filePath: string): boolean {
  // Normalize the path to use forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/')

  // Common test directory patterns
  const testPatterns = [
    /__tests__\//, // __tests__/
    /__fixtures__\//, // __fixtures__/
    /\/tests?\//, // /test/ or /tests/
    /\.test\//, // .test/
    /\/test-/, // /test-something/
    /-test\// // /something-test/
  ]

  return testPatterns.some(pattern => pattern.test(normalizedPath))
}

export function parseYAML(
  filePath: string,
  repo: string | undefined,
  content: string
): ParseYAMLResult {
  const defaultValue = 'Undefined' // Default value when json field is not defined
  let name = defaultValue
  let author = defaultValue
  let description = defaultValue
  let using = description
  let isWorkflow = false

  try {
    const parsed = YAML.parse(content)

    // Check if this is a workflow definition instead of an action definition
    // Workflows have an 'on' trigger field, actions have 'runs' field
    if (parsed.on) {
      core.info(
        `Skipping [${filePath}] in repo [${repo}] - detected as workflow definition (has 'on' trigger)`
      )
      isWorkflow = true
      return {name, author, description, using, isWorkflow}
    }

    name = parsed.name ? sanitize(parsed.name) : defaultValue
    author = parsed.author ? sanitize(parsed.author) : defaultValue
    description = parsed.description
      ? sanitize(parsed.description)
      : defaultValue

    if (parsed.runs) {
      using = parsed.runs.using ? sanitize(parsed.runs.using) : defaultValue
    }
  } catch (error) {
    // this happens in https://github.com/gaurav-nelson/github-action-markdown-link-check/blob/9de9db77de3b29b650d2e2e99f0ee290f435214b/action.yml#L9
    // because of invalid yaml
    core.warning(
      `Error parsing action file [${filePath}] in repo [${repo}] with error: ${
        error as Error
      }`
    )
    core.info(
      `The parsing error is informational, searching for actions has continued`
    )
  }
  return {name, author, description, using, isWorkflow}
}

export function sanitize(value: string) {
  return string.sanitize.keepSpace(value)
}

// Interface for a Dockerfile with actionable properties
export interface DockerActionFiles {
  [key: string]: string | boolean | undefined
  name?: string
  description?: string
  author?: string
  repo?: string
  downloadUrl?: string
  visibility?: string
  isFork?: boolean
  isArchived?: boolean
  // icon?: string
  // color?: string

  // Icon and color is needed for using dockerfiles as actions, but it's not used in the marketplace.
}

export const getActionableDockerFilesFromDisk = async (path: string) => {
  const dockerFilesWithActionArray: DockerActionFiles[] = []
  const dockerFiles = execSync(
    `find ${path} -name "Dockerfile" -o -name "dockerfile"`,
    {encoding: 'utf8'}
  ).split('\n')
  // Asynchronously process each Dockerfile
  await Promise.all(
    dockerFiles.map(async (item: string) => {
      // If the Dockerfile path is valid
      if (item) {
        // Remove the "actions/${path}/" prefix from the path
        item = item.replace(`actions/${path}/`, '')

        try {
          // Read the contents of the Dockerfile
          const data = await promisify(fs.readFile)(item, 'utf8')
          const label = 'LABEL com.github.actions.'
          // Check if the Dockerfile has actionable properties
          if (
            data.includes(`${label}name=`) &&
            data.includes(`${label}description=`)
          ) {
            core.info(`[${item}] has dockerfile as an action!`)

            // Extract the actionable properties from the Dockerfile
            const splitText = data.split('\n')
            const dockerActionFile: DockerActionFiles = {}
            splitText.forEach((line: string) => {
              if (line.startsWith('LABEL com.github.actions.')) {
                const type = line.split('.')[3].split('=')[0]
                const data = line.split('"')[1]
                dockerActionFile[type] = data
              }
            })

            core.info(`Pushing: ${JSON.stringify(dockerActionFile)}`)
            dockerFilesWithActionArray.push(dockerActionFile)
          }
        } catch (err) {
          core.info(String(err))
        }
      }
    })
  )
  return dockerFilesWithActionArray
}
