import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  GripVertical,
  List,
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Select } from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import {
  addDocument,
  editDocument,
  loadBoard,
  moveDocument,
  phaseCount,
  removeDocument,
  saveBoard,
  setPoc,
  togglePhase,
} from '@/features/review/state/boardModel'
import type {
  CellId,
  DocumentCard as Doc,
  DocumentType,
  ResponsibilitiesBoard,
  Stakeholder,
} from '@/features/review/types'

const COLUMN_WIDTH = 268
const COLUMN_GAP = 12
const DOCUMENT_TYPES: DocumentType[] = ['Drawing', 'Report', 'Calculation', 'Invoice', 'Log', 'Certificate']

type ReviewResponsibilitiesStepProps = {
  onBack: () => void
  onNext: () => void
}

type ColumnTheme = {
  tile: string
  header: string
  pill: string
  dot: string
  dash: string
}

function columnTheme(color: Stakeholder['color']): ColumnTheme {
  switch (color) {
    case 'amber':
      return {
        tile: 'bg-amber-50',
        header: 'bg-amber-50',
        pill: 'bg-amber-100 text-amber-800',
        dot: 'bg-amber-500',
        dash: 'border-amber-200',
      }
    case 'green':
      return {
        tile: 'bg-emerald-50',
        header: 'bg-emerald-50',
        pill: 'bg-emerald-100 text-emerald-800',
        dot: 'bg-emerald-500',
        dash: 'border-emerald-200',
      }
    case 'rose':
      return {
        tile: 'bg-rose-50',
        header: 'bg-rose-50',
        pill: 'bg-rose-100 text-rose-800',
        dot: 'bg-rose-500',
        dash: 'border-rose-200',
      }
    case 'violet':
      return {
        tile: 'bg-violet-50',
        header: 'bg-violet-50',
        pill: 'bg-violet-100 text-violet-800',
        dot: 'bg-violet-500',
        dash: 'border-violet-200',
      }
    case 'sky':
      return {
        tile: 'bg-sky-50',
        header: 'bg-sky-50',
        pill: 'bg-sky-100 text-sky-800',
        dot: 'bg-sky-500',
        dash: 'border-sky-200',
      }
    default:
      return {
        tile: 'bg-blue-50',
        header: 'bg-blue-50',
        pill: 'bg-blue-100 text-blue-800',
        dot: 'bg-blue-500',
        dash: 'border-blue-200',
      }
  }
}

function cellDroppableId(cell: CellId) {
  return `cell:${cell}`
}

function ColumnHeader({
  stakeholder,
  onSetPoc,
}: {
  stakeholder: Stakeholder
  onSetPoc: (id: Stakeholder['id'], value?: string) => void
}) {
  const theme = columnTheme(stakeholder.color)
  return (
    <div className={cn('flex h-9 items-center justify-between rounded-lg px-2.5', theme.header)}>
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5', theme.pill)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', theme.dot)} />
        <span className="text-[12px] font-medium">{stakeholder.label}</span>
      </span>
      <Popover>
        <PopoverTrigger asChild>
          {stakeholder.you ? (
            <button
              type="button"
              aria-label="Assigned POC: You"
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white py-0.5 pl-0.5 pr-1.5 text-[11px] text-neutral-700"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-800 text-[9px] font-medium text-white">
                Y
              </span>
              You
              <ChevronDown className="h-3 w-3 text-neutral-500" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Assign POC"
              className="inline-flex items-center gap-0.5 text-[11px] text-neutral-500 hover:text-neutral-700"
            >
              + Assign POC
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const fd = new FormData(event.currentTarget)
              const name = String(fd.get('poc') || '')
              onSetPoc(stakeholder.id, name || undefined)
            }}
            className="space-y-2"
          >
            <input
              type="text"
              name="poc"
              defaultValue={stakeholder.poc && stakeholder.poc !== 'You' ? stakeholder.poc : ''}
              placeholder="Enter name"
              className="h-8 w-full rounded border border-neutral-300 px-2 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
            />
            <div className="flex justify-between">
              <Button type="submit" size="sm" className="h-8 bg-neutral-900 px-3 text-[12px] text-white hover:bg-neutral-800">
                Save
              </Button>
              {stakeholder.poc ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-neutral-200 text-[12px] text-neutral-800"
                  onClick={() => onSetPoc(stakeholder.id, undefined)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function AddDocumentButton({
  dashClassName,
  onAdd,
}: {
  dashClassName: string
  onAdd: (type: DocumentType, title: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<DocumentType>('Report')
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center gap-1.5 rounded-md border border-dashed bg-transparent px-3 text-left text-[12px] text-neutral-500 hover:bg-white/70',
            dashClassName,
          )}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add document
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <div className="space-y-2">
          <label className="block text-[12px] text-neutral-600">Type</label>
          <Select className="wizard-select h-8" value={type} onChange={(event) => setType(event.target.value as DocumentType)}>
            {DOCUMENT_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <label className="mt-2 block text-[12px] text-neutral-600">Title</label>
          <input
            className="h-8 w-full rounded border border-neutral-300 px-2 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter title"
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              className="h-8 bg-neutral-900 px-3 text-[12px] text-white hover:bg-neutral-800"
              onClick={() => {
                if (title.trim().length === 0) return
                onAdd(type, title.trim())
                setTitle('')
                setOpen(false)
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DocumentCard({
  doc,
  onEdit,
  onRemove,
  dragAttributes,
  dragListeners,
  isOverlay,
}: {
  doc: Doc
  onEdit: (values: Partial<Pick<Doc, 'title' | 'type'>>) => void
  onRemove: () => void
  dragAttributes?: DraggableAttributes
  dragListeners?: Record<string, unknown>
  isOverlay?: boolean
}) {
  return (
    <div
      className={cn(
        'group rounded-md border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        isOverlay && 'opacity-90 shadow-md',
      )}
    >
      <div className="flex items-center justify-between px-2.5 pt-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Drag"
            className="text-neutral-300 hover:text-neutral-500"
            {...dragAttributes}
            {...dragListeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] text-neutral-400">{doc.type}</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="More"
              className="rounded p-1 text-neutral-400 opacity-0 hover:bg-neutral-100 hover:text-neutral-700 focus:opacity-100 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2">
            <div className="space-y-1">
              <button
                type="button"
                className="w-full rounded px-2 py-1.5 text-left text-[13px] hover:bg-neutral-100"
                onClick={() => onEdit({ title: `${doc.title} (edited)` })}
              >
                Quick edit title
              </button>
              <button
                type="button"
                className="w-full rounded px-2 py-1.5 text-left text-[13px] text-rose-600 hover:bg-rose-50"
                onClick={onRemove}
              >
                Remove
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="px-2.5 pb-2.5 pt-0.5">
        <p className="text-[13px] font-medium text-neutral-900">{doc.title}</p>
      </div>
    </div>
  )
}

function SortableDocument({
  doc,
  cell,
  onEdit,
  onRemove,
}: {
  doc: Doc
  cell: CellId
  onEdit: (values: Partial<Pick<Doc, 'title' | 'type'>>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: doc.id,
    data: { cell },
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'z-50 opacity-50')}
    >
      <DocumentCard
        doc={doc}
        onEdit={onEdit}
        onRemove={onRemove}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  )
}

function BoardCell({
  cell,
  stakeholder,
  items,
  onAdd,
  onEdit,
  onRemove,
}: {
  cell: CellId
  stakeholder: Stakeholder
  items: Doc[]
  onAdd: (type: DocumentType, title: string) => void
  onEdit: (id: string, values: Partial<Pick<Doc, 'title' | 'type'>>) => void
  onRemove: (id: string) => void
}) {
  const theme = columnTheme(stakeholder.color)
  const { setNodeRef, isOver } = useDroppable({
    id: cellDroppableId(cell),
    data: { cell },
  })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-h-[92px] flex-col gap-2 rounded-lg p-2.5',
        theme.tile,
        isOver && 'ring-2 ring-neutral-400 ring-offset-1',
      )}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
        {items.map((doc) => (
          <SortableDocument
            key={doc.id}
            doc={doc}
            cell={cell}
            onEdit={(values) => onEdit(doc.id, values)}
            onRemove={() => onRemove(doc.id)}
          />
        ))}
      </SortableContext>
      <AddDocumentButton dashClassName={theme.dash} onAdd={onAdd} />
    </div>
  )
}

export function ReviewResponsibilitiesStep({ onBack, onNext }: ReviewResponsibilitiesStepProps) {
  const [board, setBoard] = useState<ResponsibilitiesBoard>(() => loadBoard())
  const [view, setView] = useState<'criteria' | 'documents'>('documents')
  const [active, setActive] = useState<{ id: string; from: CellId; doc: Doc } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    saveBoard(board)
  }, [board])

  const columnCount = board.stakeholders.length
  const boardMinWidth = columnCount * COLUMN_WIDTH + (columnCount - 1) * COLUMN_GAP
  const gridTemplateColumns = `repeat(${columnCount}, ${COLUMN_WIDTH}px)`

  function scrollBy(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  function findDocCell(id: string): { cell: CellId; index: number; doc: Doc } | null {
    for (const key of Object.keys(board.cells) as CellId[]) {
      const index = board.cells[key].findIndex((item) => item.id === id)
      if (index >= 0) return { cell: key, index, doc: board.cells[key][index] }
    }
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    const found = findDocCell(String(event.active.id))
    if (found) setActive({ id: found.doc.id, from: found.cell, doc: found.doc })
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!active) return
    const overId = event.over?.id
    if (overId == null) {
      setActive(null)
      return
    }

    const overData = event.over?.data.current as { cell?: CellId } | undefined
    const overCell =
      overData?.cell ??
      (String(overId).startsWith('cell:') ? (String(overId).slice(5) as CellId) : findDocCell(String(overId))?.cell)
    if (!overCell) {
      setActive(null)
      return
    }

    const overDocIndex = (board.cells[overCell] ?? []).findIndex((item) => item.id === String(overId))
    const toIndex = overDocIndex >= 0 ? overDocIndex : (board.cells[overCell] ?? []).length
    const fromIndex = (board.cells[active.from] ?? []).findIndex((item) => item.id === active.id)

    if (active.from === overCell) {
      if (fromIndex < 0 || fromIndex === toIndex) {
        setActive(null)
        return
      }
      setBoard({
        ...board,
        cells: {
          ...board.cells,
          [overCell]: arrayMove(board.cells[overCell], fromIndex, toIndex),
        },
      })
    } else {
      setBoard(moveDocument(board, { id: active.id, from: active.from, to: overCell, index: toIndex }))
    }
    setActive(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="review-step">
      <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 max-w-[42rem]">
          <p className="text-[12px] text-neutral-400">Step 5 of 6</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">Review responsibilities</h1>
          <p className="mt-1 text-[13px] leading-5 text-neutral-500">
            Every document is placed on the timeline under the stakeholder who submits it. Columns are
            stakeholders, rows are timeline phases.
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Review view"
          className="inline-flex shrink-0 items-center rounded-lg bg-neutral-100 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === 'criteria'}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px]',
              view === 'criteria' ? 'bg-white font-medium text-neutral-900 shadow-sm' : 'text-neutral-600',
            )}
            onClick={() => setView('criteria')}
          >
            <List className="h-3.5 w-3.5" aria-hidden="true" />
            Criteria
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'documents'}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px]',
              view === 'documents' ? 'bg-white font-medium text-neutral-900 shadow-sm' : 'text-neutral-600',
            )}
            onClick={() => setView('documents')}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Documents
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="min-w-0 flex-1 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-2 text-[12px] text-neutral-600">
          <span className="mr-8">
            <strong className="font-semibold text-neutral-800">Click a column header</strong> to add / remove a POC
          </span>
          <span className="mr-8">
            <strong className="font-semibold text-neutral-800">+ Add document</strong> adds a project-specific document
          </span>
          <span>
            <strong className="font-semibold text-neutral-800">Drag</strong> an item to reassign
          </span>
        </div>
        <button
          type="button"
          aria-label="Scroll left"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
          onClick={() => scrollBy(-(COLUMN_WIDTH + COLUMN_GAP))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
          onClick={() => scrollBy(COLUMN_WIDTH + COLUMN_GAP)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {view === 'criteria' ? (
        <div className="mt-6 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-[13px] text-neutral-500">
          Criteria view will appear here once the scorecard mapping is available.
        </div>
      ) : (
        <div className="mt-3 min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto overflow-y-auto" ref={scrollRef} data-testid="review-board-scroll">
            <div style={{ minWidth: boardMinWidth }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActive(null)}
              >
                <div className="grid" style={{ gridTemplateColumns, columnGap: COLUMN_GAP }}>
                  {board.stakeholders.map((stakeholder) => (
                    <ColumnHeader key={stakeholder.id} stakeholder={stakeholder} onSetPoc={(id, value) => setBoard((current) => setPoc(current, { stakeholderId: id, poc: value }))} />
                  ))}
                </div>

                {board.phases.map((phase) => {
                  const count = phaseCount(board, phase.id)
                  return (
                    <section key={phase.id} className="mt-3">
                      <button
                        type="button"
                        className="sticky left-0 z-10 flex items-center gap-2 bg-white py-0.5 pr-4 text-left"
                        aria-expanded={!phase.collapsed}
                        onClick={() => setBoard((current) => togglePhase(current, phase.id))}
                      >
                        <ChevronUp
                          className={cn('h-3.5 w-3.5 text-neutral-500 transition-transform', phase.collapsed && 'rotate-180')}
                        />
                        <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
                          {phase.label}
                        </span>
                        <span className="text-[12px] text-neutral-500">
                          {phase.dateRange}
                          <span className="text-neutral-400"> · </span>
                          {count} items
                        </span>
                      </button>
                      {!phase.collapsed ? (
                        <div
                          className="mt-2 grid items-stretch"
                          style={{ gridTemplateColumns, columnGap: COLUMN_GAP }}
                        >
                          {board.stakeholders.map((stakeholder) => {
                            const cell = `${phase.id}:${stakeholder.id}` as CellId
                            return (
                              <BoardCell
                                key={cell}
                                cell={cell}
                                stakeholder={stakeholder}
                                items={board.cells[cell] ?? []}
                                onAdd={(type, title) => setBoard((current) => addDocument(current, { cell, type, title }))}
                                onEdit={(id, values) => setBoard((current) => editDocument(current, { cell, id, ...values }))}
                                onRemove={(id) => setBoard((current) => removeDocument(current, { cell, id }))}
                              />
                            )
                          })}
                        </div>
                      ) : null}
                    </section>
                  )
                })}
                <DragOverlay dropAnimation={null}>
                  {active ? <DocumentCard doc={active.doc} onEdit={() => undefined} onRemove={() => undefined} isOverlay /> : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-5">
        <Button
          type="button"
          variant="outline"
          className="h-9 border-neutral-200 bg-white text-[13px] font-medium text-neutral-800 shadow-none"
          onClick={onBack}
          data-testid="review-back"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          className="h-9 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-800"
          onClick={onNext}
          data-testid="review-next"
        >
          Next: Add stakeholders
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
