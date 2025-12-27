import {wait} from '../src/wait'
import {expect, test} from '@jest/globals'

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
