import type {
  AddPayload,
  CellId,
  DocumentCard,
  EditPayload,
  MovePayload,
  Phase,
  PhaseId,
  PocPayload,
  RemovePayload,
  ResponsibilitiesBoard,
  Stakeholder,
} from '@/features/review/types'

const STORAGE_KEY = 'review_board_draft_v1'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

const PHASES: Phase[] = [
  { id: 'scoping', label: 'Scoping', dateRange: 'Aug – Sep 2026', collapsed: false },
  { id: 'design', label: 'Design phase', dateRange: 'Nov 2026 – Jun 2027', collapsed: false },
  { id: 'post-design', label: 'Post-Design', dateRange: 'Jun – Oct 2027', collapsed: false },
  {
    id: 'construction',
    label: 'Construction phase',
    dateRange: 'Oct 2027 – Dec 2028',
    collapsed: false,
  },
  { id: 'post-construction', label: 'Post construction', dateRange: 'Jan – Mar 2029', collapsed: false },
]

const STAKEHOLDERS: Stakeholder[] = [
  { id: 'architect', label: 'Architect', color: 'blue' },
  { id: 'mep', label: 'MEP consultant', color: 'amber' },
  { id: 'gbc', label: 'GBC', color: 'green', you: true, poc: 'You' },
  { id: 'contractor', label: 'Contractor', color: 'rose' },
]

function createEmptyCells(): ResponsibilitiesBoard['cells'] {
  const cells = {} as ResponsibilitiesBoard['cells']
  for (const phase of PHASES) {
    for (const col of STAKEHOLDERS) {
      const key = `${phase.id}:${col.id}` as CellId
      cells[key] = []
    }
  }
  return cells
}

export function createInitialBoard(): ResponsibilitiesBoard {
  const cells = createEmptyCells()

  // Populate documents exactly as in the design
  cells['scoping:architect'] = [
    { id: uid(), type: 'Drawing', title: 'Site plan' },
  ]
  cells['scoping:gbc'] = [{ id: uid(), type: 'Report', title: 'Kick-off minutes' }]

  cells['design:architect'] = [
    { id: uid(), type: 'Drawing', title: 'Landscape drawings' },
    { id: uid(), type: 'Drawing', title: 'Rainwater schematic' },
  ]
  cells['design:mep'] = [{ id: uid(), type: 'Report', title: 'Energy model report' }]

  cells['post-design:architect'] = [{ id: uid(), type: 'Report', title: 'Design stage report' }]
  cells['post-design:mep'] = [{ id: uid(), type: 'Calculation', title: 'Load calculations' }]

  cells['construction:mep'] = [{ id: uid(), type: 'Report', title: 'Commissioning plan' }]
  cells['construction:contractor'] = [
    { id: uid(), type: 'Invoice', title: 'Material invoices' },
    { id: uid(), type: 'Log', title: 'Waste logs' },
  ]

  cells['post-construction:architect'] = [{ id: uid(), type: 'Drawing', title: 'As-built drawings' }]
  cells['post-construction:mep'] = [{ id: uid(), type: 'Report', title: 'Commissioning report' }]
  cells['post-construction:gbc'] = [{ id: uid(), type: 'Report', title: 'Final submission pack' }]
  cells['post-construction:contractor'] = [
    { id: uid(), type: 'Certificate', title: 'Completion certificate' },
  ]

  return {
    phases: PHASES,
    stakeholders: STAKEHOLDERS,
    cells,
  }
}

export function loadBoard(): ResponsibilitiesBoard {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return createInitialBoard()
  try {
    const parsed = JSON.parse(raw) as ResponsibilitiesBoard
    // Merge with current shape to avoid stale keys
    const next: ResponsibilitiesBoard = {
      phases: PHASES.map((p) => {
        const found = parsed.phases.find((x) => x.id === p.id)
        return found ? { ...p, collapsed: found.collapsed } : p
      }),
      stakeholders: STAKEHOLDERS.map((c) => {
        const found = parsed.stakeholders.find((x) => x.id === c.id)
        return found ? { ...c, poc: found.poc } : c
      }),
      cells: createEmptyCells(),
    }
    for (const key of Object.keys(next.cells) as CellId[]) {
      next.cells[key] = parsed.cells?.[key] ?? []
    }
    return next
  } catch {
    return createInitialBoard()
  }
}

export function saveBoard(board: ResponsibilitiesBoard) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
}

export function moveDocument(board: ResponsibilitiesBoard, payload: MovePayload): ResponsibilitiesBoard {
  const next: ResponsibilitiesBoard = {
    ...board,
    cells: { ...board.cells },
  }
  const fromArr = [...(next.cells[payload.from] ?? [])]
  const toArr = [...(next.cells[payload.to] ?? [])]
  const idx = fromArr.findIndex((d) => d.id === payload.id)
  if (idx === -1) return board
  const [doc] = fromArr.splice(idx, 1)
  toArr.splice(payload.index, 0, doc)
  next.cells[payload.from] = fromArr
  next.cells[payload.to] = toArr
  return next
}

export function addDocument(board: ResponsibilitiesBoard, payload: AddPayload): ResponsibilitiesBoard {
  const next: ResponsibilitiesBoard = {
    ...board,
    cells: { ...board.cells },
  }
  const arr = [...(next.cells[payload.cell] ?? [])]
  const doc: DocumentCard = { id: uid(), type: payload.type, title: payload.title }
  arr.push(doc)
  next.cells[payload.cell] = arr
  return next
}

export function editDocument(board: ResponsibilitiesBoard, payload: EditPayload): ResponsibilitiesBoard {
  const next: ResponsibilitiesBoard = {
    ...board,
    cells: { ...board.cells },
  }
  const arr = [...(next.cells[payload.cell] ?? [])]
  const idx = arr.findIndex((d) => d.id === payload.id)
  if (idx === -1) return board
  const doc = { ...arr[idx] }
  if (payload.type) doc.type = payload.type
  if (payload.title) doc.title = payload.title
  arr[idx] = doc
  next.cells[payload.cell] = arr
  return next
}

export function removeDocument(board: ResponsibilitiesBoard, payload: RemovePayload): ResponsibilitiesBoard {
  const next: ResponsibilitiesBoard = {
    ...board,
    cells: { ...board.cells },
  }
  next.cells[payload.cell] = (next.cells[payload.cell] ?? []).filter((d) => d.id !== payload.id)
  return next
}

export function setPoc(board: ResponsibilitiesBoard, payload: PocPayload): ResponsibilitiesBoard {
  const next: ResponsibilitiesBoard = { ...board, stakeholders: board.stakeholders.map((x) => ({ ...x })) }
  const s = next.stakeholders.find((s) => s.id === payload.stakeholderId)
  if (s) {
    s.poc = payload.poc
  }
  return next
}

export function togglePhase(board: ResponsibilitiesBoard, phaseId: PhaseId): ResponsibilitiesBoard {
  const next: ResponsibilitiesBoard = { ...board, phases: board.phases.map((x) => ({ ...x })) }
  const p = next.phases.find((p) => p.id === phaseId)
  if (p) p.collapsed = !p.collapsed
  return next
}

export function phaseCount(board: ResponsibilitiesBoard, phaseId: PhaseId): number {
  let total = 0
  for (const stakeholder of board.stakeholders) {
    total += (board.cells[`${phaseId}:${stakeholder.id}` as CellId] ?? []).length
  }
  return total
}

