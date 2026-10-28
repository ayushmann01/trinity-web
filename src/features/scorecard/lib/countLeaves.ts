import type { CriteriaNode } from '@/features/scorecard/types'

export function countLeaves(
  nodes: CriteriaNode[],
  yes: Set<number>,
): { attempted: number; total: number } {
  let attempted = 0
  let total = 0

  const walk = (node: CriteriaNode) => {
    if (node.children.length === 0) {
      if (node.selectable || node.mandatory) {
        total += 1
        if (yes.has(node.id) || node.attempt_state === 'YES') attempted += 1
      }
      return
    }
    for (const child of node.children) walk(child)
  }

  for (const node of nodes) walk(node)
  return { attempted, total }
}
