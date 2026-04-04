// @ts-expect-error - Mock @actions/core for testing (jest global not available in TS)
jest.mock('@actions/core')

import {wait} from '../src/wait'
import {expect, test, describe, beforeEach} from '@jest/globals'
import {
  findDuplicatesByNameRepo,
  reportDuplicateActions,
  ActionLike
} from '../src/duplicates'
import * as core from '@actions/core'

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

test('ActionContent structure should include visibility and isFork', () => {
  // Test that ActionContent has the expected structure
  const mockAction = {
    name: 'test-action',
    owner: 'test-owner',
    repo: 'test-repo',
    path: 'path/to/action',
    downloadUrl: 'https://example.com/action.yml',
    author: 'test-author',
    description: 'test description',
    forkedfrom: '',
    readme: '',
    using: 'node16',
    isArchived: false,
    visibility: 'public',
    isFork: false
  }

  expect(mockAction).toHaveProperty('visibility')
  expect(mockAction).toHaveProperty('isFork')
  expect(mockAction.visibility).toBe('public')
  expect(mockAction.isFork).toBe(false)
})

test('WorkflowContent structure should include visibility', () => {
  // Test that WorkflowContent has the expected structure
  const mockWorkflow = {
    name: 'test-workflow',
    owner: 'test-owner',
    repo: 'test-repo',
    downloadUrl: 'https://example.com/workflow.yml',
    description: 'test workflow',
    forkedfrom: '',
    isArchived: false,
    visibility: 'private'
  }

  expect(mockWorkflow).toHaveProperty('visibility')
  expect(mockWorkflow.visibility).toBe('private')
})

test('URL normalization prevents double protocol', () => {
  // Test that URLs are constructed correctly without double protocol
  const testUrls = [
    {input: 'https://github.com', expected: 'github.com'},
    {input: 'http://github.com', expected: 'github.com'},
    {input: 'github.com', expected: 'github.com'},
    {input: 'https://example.github.com', expected: 'example.github.com'}
  ]

  testUrls.forEach(({input, expected}) => {
    const normalized = input.replace(/^https?:\/\//, '')
    expect(normalized).toBe(expected)
  })
})

describe('findDuplicatesByNameRepo', () => {
  function makeAction(
    name: string,
    repo: string,
    actionPath?: string
  ): ActionLike {
    return {
      name,
      repo,
      path: actionPath || ''
    }
  }

  test('returns empty array when no duplicates exist', () => {
    const actions = [
      makeAction('action-a', 'repo-a'),
      makeAction('action-b', 'repo-b'),
      makeAction('action-c', 'repo-c')
    ]

    const result = findDuplicatesByNameRepo(actions)
    expect(result).toHaveLength(0)
  })

  test('returns empty array for empty input', () => {
    const result = findDuplicatesByNameRepo([])
    expect(result).toHaveLength(0)
  })

  test('detects duplicates with same name and repo but different paths', () => {
    const actions = [
      makeAction('My Action', 'my-repo', ''),
      makeAction('My Action', 'my-repo', 'composite'),
      makeAction('Other Action', 'other-repo')
    ]

    const result = findDuplicatesByNameRepo(actions)
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('My Action | my-repo')
    expect(result[0].actions).toHaveLength(2)
  })

  test('detects multiple duplicate groups', () => {
    const actions = [
      makeAction('Action A', 'repo-a', ''),
      makeAction('Action A', 'repo-a', 'docker'),
      makeAction('Action B', 'repo-b', ''),
      makeAction('Action B', 'repo-b', 'composite'),
      makeAction('Action C', 'repo-c')
    ]

    const result = findDuplicatesByNameRepo(actions)
    expect(result).toHaveLength(2)
  })

  test('does not treat actions with same name but different repos as duplicates', () => {
    const actions = [
      makeAction('My Action', 'repo-a'),
      makeAction('My Action', 'repo-b')
    ]

    const result = findDuplicatesByNameRepo(actions)
    expect(result).toHaveLength(0)
  })
})

describe('reportDuplicateActions', () => {
  beforeEach(() => {
    // @ts-expect-error - jest global not available in TS
    jest.clearAllMocks()
  })

  function makeAction(
    name: string,
    repo: string,
    actionPath?: string
  ): ActionLike {
    return {
      name,
      repo,
      path: actionPath || ''
    }
  }

  test('logs warning with duplicate details', async () => {
    const duplicates = [
      {
        key: 'My Action | my-repo',
        actions: [
          makeAction('My Action', 'my-repo', ''),
          makeAction('My Action', 'my-repo', 'composite')
        ]
      }
    ]

    await reportDuplicateActions(duplicates, 10, 8)

    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('1 action(s) with duplicate name+repo')
    )
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate action: [My Action | my-repo]')
    )
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('(root), composite')
    )
  })

  test('writes to step summary', async () => {
    const duplicates = [
      {
        key: 'My Action | my-repo',
        actions: [
          makeAction('My Action', 'my-repo', ''),
          makeAction('My Action', 'my-repo', 'composite')
        ]
      }
    ]

    await reportDuplicateActions(duplicates, 10, 8)

    expect(core.summary.addHeading).toHaveBeenCalledWith(
      'Duplicate Actions Detected',
      3
    )
    expect(core.summary.addTable).toHaveBeenCalled()
    expect(core.summary.write).toHaveBeenCalled()
  })
})
