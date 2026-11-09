import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type SyntheticListenerMap,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronLeft, ChevronRight, ChevronUp, GripVertical, MoreHorizontal } from 'lucide-react'
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
import type { CellId, DocumentCard as Doc, DocumentType, ResponsibilitiesBoard, Stakeholder } from '@/features/review/types'

type ReviewResponsibilitiesStepProps = {
  onBack: () => void
  onNext: () => void
}

function ColumnHeader({
  stakeholder,
  onSetPoc,
}: {
  stakeholder: Stakeholder
  onSetPoc: (id: Stakeholder['id'], value?: string) => void
}) {
  const colorBg =
    stakeholder.color === 'blue'
      ? 'bg-blue-50'
      : stakeholder.color === 'amber'
        ? 'bg-amber-50'
        : stakeholder.color === 'green'
          ? 'bg-emerald-50'
          : 'bg-rose-50'
  const dotColor =
    stakeholder.color === 'blue'
      ? 'bg-blue-500'
      : stakeholder.color === 'amber'
        ? 'bg-amber-500'
        : stakeholder.color === 'green'
          ? 'bg-emerald-600'
          : 'bg-rose-500'
  return (
    <div className={cn('rounded-md border border-neutral-200 px-2 py-1.5', colorBg)}>
      <div className="flex items-center gap-2">
        <span className={cn('h-2 w-2 rounded-full', dotColor)} />
        <span className="text-[12px] font-medium text-neutral-900">{stakeholder.label}</span>
        <div className="ml-auto flex items-center gap-1">
          {stakeholder.you ? (
            <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-1.5 py-0.5 text-[11px] text-neutral-700">
              <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-800 text-[10px] text-white">
                Y
              </span>
              You
            </span>
          ) : null}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Assign POC"
                className="rounded-md px-1 py-0.5 text-[11px] text-neutral-700 hover:bg-neutral-100"
              >
                {stakeholder.poc ? `POC: ${stakeholder.poc}` : '+ Assign POC'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget as HTMLFormElement)
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
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 bg-neutral-900 px-3 text-[12px] text-white hover:bg-neutral-800"
                  >
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
      </div>
    </div>
  )
}

function AddDocumentButton({
  onAdd,
}: {
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
          className="flex h-9 w-full items-center justify-center rounded-md border-2 border-dashed border-neutral-300 bg-white text-[12px] text-neutral-600 hover:bg-neutral-50"
        >
          + Add document
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <div className="space-y-2">
          <label className="block text-[12px] text-neutral-600">Type</label>
          <Select
            className="wizard-select h-8"
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType)}
          >
            {['Drawing', 'Report', 'Calculation', 'Invoice', 'Log', 'Certificate'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <label className="mt-2 block text-[12px] text-neutral-600">Title</label>
          <input
            className="h-8 w-full rounded border border-neutral-300 px-2 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
  transform,
  isOverlay,
}: {
  doc: Doc
  onEdit: (values: Partial<Pick<Doc, 'title' | 'type'>>) => void
  onRemove: () => void
  dragAttributes?: DraggableAttributes
  dragListeners?: SyntheticListenerMap
  transform?: string
  isOverlay?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-neutral-200 bg-white shadow-sm',
        isOverlay ? 'opacity-90' : undefined,
      )}
      style={transform ? { transform } : undefined}
    >
      <div className="flex items-center justify-between px-2.5 pb-1 pt-2">
        <div className="flex items-center gap-1.5">
          <button
            aria-label="Drag"
            className="text-neutral-400 hover:text-neutral-600"
            {...dragAttributes}
            {...dragListeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-[11px] text-neutral-500">{doc.type}</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="More"
              className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2">
            <div className="space-y-2">
              <button
                className="w-full rounded px-2 py-1.5 text-left text-[13px] hover:bg-neutral-100"
                onClick={() => onEdit({ title: doc.title + ' (edited)' })}
              >
                Quick edit title
              </button>
              <button
                className="w-full rounded px-2 py-1.5 text-left text-[13px] text-rose-600 hover:bg-rose-50"
                onClick={onRemove}
              >
                Remove
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="px-2.5 pb-2">
        <p className="text-[13px] font-medium text-neutral-900">{doc.title}</p>
      </div>
    </div>
  )
}

function SortableDocument({
  doc,
  id,
  onEdit,
  onRemove,
}: {
  doc: Doc
  id: string
  onEdit: (values: Partial<Pick<Doc, 'title' | 'type'>>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging ? 'z-50' : undefined)}>
      <DocumentCard doc={doc} onEdit={onEdit} onRemove={onRemove} dragAttributes={attributes} dragListeners={listeners} />
    </div>
  )
}

export function ReviewResponsibilitiesStep({ onBack, onNext }: ReviewResponsibilitiesStepProps) {
  const [board, setBoard] = useState<ResponsibilitiesBoard>(() => loadBoard())
  const [active, setActive] = useState<{ id: string; from: CellId; doc: Doc } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  )

  useEffect(() => {
    saveBoard(board)
  }, [board])

  // no-op: dependencies ensure layout recalculates when shape changes

  function scrollBy(delta: number) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: el.scrollLeft + delta, behavior: 'smooth' })
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id)
    for (const key of Object.keys(board.cells) as CellId[]) {
      const hit = board.cells[key].find((d) => d.id === id)
      if (hit) {
        setActive({ id, from: key, doc: hit })
        return
      }
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!active) return
    const overId = e.over?.id
    if (!overId) {
      setActive(null)
      return
    }

    const toCell = String(overId) as CellId
    const fromCell = active.from
    const toIndex = (board.cells[toCell] ?? []).findIndex((d) => d.id === active.id)
    const finalIndex = toIndex >= 0 ? toIndex : (board.cells[toCell] ?? []).length
    const next =
      fromCell === toCell
        ? {
            ...board,
            cells: {
              ...board.cells,
              [toCell]: arrayMove(board.cells[toCell], board.cells[toCell].findIndex((d) => d.id === active.id), finalIndex),
            },
          }
        : moveDocument(board, { id: active.id, from: fromCell, to: toCell, index: finalIndex })
    setBoard(next)
    setActive(null)
  }

  function handleAdd(cell: CellId, type: DocumentType, title: string) {
    setBoard((b) => addDocument(b, { cell, type, title }))
  }
  function handleEdit(cell: CellId, id: string, values: Partial<Pick<Doc, 'title' | 'type'>>) {
    setBoard((b) => editDocument(b, { cell, id, ...values }))
  }
  function handleRemove(cell: CellId, id: string) {
    setBoard((b) => removeDocument(b, { cell, id }))
  }

  function onSetPoc(stakeholderId: Stakeholder['id'], value?: string) {
    setBoard((b) => setPoc(b, { stakeholderId, poc: value }))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="review-step">
      <p className="text-[12px] text-neutral-400">Step 5 of 6</p>
      <div className="mt-1 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900">Review responsibilities</h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            Every document is placed on the timeline under the stakeholder who submits it. Columns are stakeholders,
            rows are timeline phases.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-neutral-200 bg-white text-[12px] font-medium text-neutral-800 shadow-none"
          >
            Criteria
          </Button>
          <Button type="button" size="sm" className="h-8 bg-neutral-900 text-[12px] text-white">
            Documents
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-neutral-700">
        <div className="flex items-center gap-6">
          <span>
            <strong>Click a column header</strong> to add / remove a POC
          </span>
          <span>
            <strong>+ Add document</strong> adds a project-specific document
          </span>
          <span>
            <strong>Drag</strong> an item to reassign
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Scroll left"
            className="rounded border border-neutral-200 p-1 text-neutral-700 hover:bg-neutral-100"
            onClick={() => scrollBy(-320)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Scroll right"
            className="rounded border border-neutral-200 p-1 text-neutral-700 hover:bg-neutral-100"
            onClick={() => scrollBy(320)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-md border border-neutral-200">
        <div className="flex min-h-0 flex-1 overflow-x-auto" ref={scrollRef}>
          {/* sticky left column with phase labels */}
          <div className="sticky left-0 z-20 w-[260px] shrink-0 border-r border-neutral-200 bg-white">
            <div className="h-[66px] border-b border-neutral-200" />
            {board.phases.map((phase) => {
              const count = phaseCount(board, phase.id)
              return (
                <div key={phase.id} className="border-b border-neutral-200">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50"
                    aria-expanded={!phase.collapsed}
                    onClick={() => setBoard((b) => togglePhase(b, phase.id))}
                  >
                    <ChevronUp className={cn('h-4 w-4 transition-transform', phase.collapsed ? 'rotate-180' : '')} />
                    <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
                      {phase.label}
                    </span>
                    <span className="ml-2 text-[12px] text-neutral-500">{phase.dateRange}</span>
                    <span className="ml-auto text-[12px] text-neutral-500">{count} items</span>
                  </button>
                </div>
              )
            })}
          </div>

        {/* scrollable columns */}
          <div className="min-h-0 flex-1">
            <div
              className="grid auto-cols-[320px] grid-flow-col"
              style={{ minWidth: 320 * board.stakeholders.length }}
            >
              {/* column headers */}
              {board.stakeholders.map((s) => (
                <div key={s.id} className="border-r border-neutral-200">
                  <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white p-2">
                    <ColumnHeader stakeholder={s} onSetPoc={onSetPoc} />
                  </div>
                </div>
              ))}

              {/* rows rendering per phase with cells underneath in their own grid row */}
              {board.phases.map((phase) => {
                return (
                  <div
                    key={phase.id}
                    className={cn('col-span-full border-b border-neutral-200 bg-white', phase.collapsed && 'opacity-70')}
                  >
                    {!phase.collapsed && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <div
                          className="grid gap-x-0"
                          style={{ gridTemplateColumns: `repeat(${board.stakeholders.length}, 320px)` }}
                        >
                          {board.stakeholders.map((s) => {
                            const cell = `${phase.id}:${s.id}` as CellId
                            const items = board.cells[cell] ?? []
                            return (
                              <div key={cell} className="border-r border-neutral-200 p-3">
                                <SortableContext items={items.map((d) => d.id)} strategy={rectSortingStrategy}>
                                  <div className="space-y-2" id={`cell-${cell}`}>
                                    {items.map((doc) => (
                                      <SortableDocument
                                        key={doc.id}
                                        id={doc.id}
                                        doc={doc}
                                        onEdit={(vals) => handleEdit(cell, doc.id, vals)}
                                        onRemove={() => handleRemove(cell, doc.id)}
                                      />
                                    ))}
                                    <AddDocumentButton onAdd={(type, title) => handleAdd(cell, type, title)} />
                                  </div>
                                </SortableContext>
                              </div>
                            )
                          })}
                        </div>
                        <DragOverlay>
                          {active ? (
                            <DocumentCard doc={active.doc} onEdit={() => {}} onRemove={() => {}} isOverlay />
                          ) : null}
                        </DragOverlay>
                      </DndContext>
                    )}
                    {phase.collapsed && (
                      <div className="p-3 text-[12px] text-neutral-500">Phase collapsed</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-6">
        <Button
          type="button"
          variant="outline"
          className="h-9 border-neutral-200 bg-white text-[13px] font-medium text-neutral-800 shadow-none"
          onClick={onBack}
          data-testid="review-back"
        >
          ← Back
        </Button>
        <Button
          type="button"
          className="h-9 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-800"
          onClick={onNext}
          data-testid="review-next"
        >
          Next: Add stakeholders →
        </Button>
      </div>
    </div>
  )
}

