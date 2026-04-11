import * as core from '@actions/core'

export interface ActionLike {
  name: string | undefined
  repo: string | undefined
  path: string | undefined
}

export interface DuplicateGroup {
  key: string
  actions: ActionLike[]
}

export function findDuplicatesByNameRepo(
  actions: ActionLike[]
): DuplicateGroup[] {
  const grouped = new Map<string, ActionLike[]>()
  for (const action of actions) {
    const key = `${action.name} | ${action.repo}`
    const group = grouped.get(key)
    if (group) {
      group.push(action)
    } else {
      grouped.set(key, [action])
    }
  }

  const duplicates: DuplicateGroup[] = []
  for (const [key, group] of grouped) {
    if (group.length > 1) {
      duplicates.push({key, actions: group})
    }
  }

  return duplicates
}

export async function reportDuplicateActions(
  duplicates: DuplicateGroup[],
  countBeforeDedup: number,
  countAfterDedup: number
): Promise<void> {
  const totalDuplicateEntries = duplicates.reduce(
    (sum, group) => sum + group.actions.length,
    0
  )
  const errorMessage = `Found ${duplicates.length} action(s) with duplicate name+repo combinations (${totalDuplicateEntries} entries total). Count before dedup: ${countBeforeDedup}, after dedup: ${countAfterDedup}`
  core.warning(errorMessage)

  // Log each duplicate group with details
  for (const group of duplicates) {
    core.warning(
      `Duplicate action: [${group.key}] found ${group.actions.length} times with paths: ${group.actions.map(a => a.path || '(root)').join(', ')}`
    )
  }

  // Write to step summary
  try {
    const summaryRows: [string, string, string][] = duplicates.map(group => [
      group.actions[0].name || 'Unknown',
      group.actions[0].repo || 'Unknown',
      group.actions.map(a => a.path || '(root)').join(', ')
    ])

    await core.summary
      .addHeading('Duplicate Actions Detected', 3)
      .addRaw(errorMessage, true)
      .addRaw('', true)
      .addRaw(
        'These actions share the same name and repo but have different paths:',
        true
      )
      .addTable([
        [
          {data: 'Action Name', header: true},
          {data: 'Repository', header: true},
          {data: 'Paths', header: true}
        ],
        ...summaryRows
      ])
      .write()
  } catch (error) {
    core.debug(`Failed to write step summary: ${error}`)
  }
}
