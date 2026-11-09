import {
  addDocument,
  createInitialBoard,
  moveDocument,
  phaseCount,
  removeDocument,
} from '@/features/review/state/boardModel'
import type { CellId } from '@/features/review/types'
import { describe, expect, it } from 'vitest'

describe('review board model', () => {
  it('computes item counts per phase', () => {
    const board = createInitialBoard()
    expect(phaseCount(board, 'scoping')).toBe(2)
    expect(phaseCount(board, 'design')).toBe(3)
    expect(phaseCount(board, 'post-design')).toBe(2)
    expect(phaseCount(board, 'construction')).toBe(3)
    expect(phaseCount(board, 'post-construction')).toBe(4)
  })

  it('moves documents across cells and updates counts', () => {
    let board = createInitialBoard()
    const from: CellId = 'scoping:architect'
    const to: CellId = 'design:gbc'
    const moving = board.cells[from][0]!
    board = moveDocument(board, { id: moving.id, from, to, index: 0 })
    expect(board.cells[from].some((d) => d.id === moving.id)).toBe(false)
    expect(board.cells[to][0]?.id).toBe(moving.id)
    // counts changed accordingly
    expect(phaseCount(board, 'scoping')).toBe(1)
    expect(phaseCount(board, 'design')).toBe(4)
  })

  it('adds and removes documents', () => {
    let board = createInitialBoard()
    const cell: CellId = 'post-design:gbc'
    board = addDocument(board, { cell, type: 'Report', title: 'Site walk report' })
    expect(board.cells[cell]).toHaveLength(1)
    board = removeDocument(board, { cell, id: board.cells[cell][0]!.id })
    expect(board.cells[cell]).toHaveLength(0)
  })
})

