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
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronLeft, ChevronRight, ChevronUp, GripVertical, MoreHorizontal, ArrowLeft, ArrowRight, FileText, List } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { cn } from '@/shared/lib/utils'
import { addDocument, editDocument, loadBoard, moveDocument, phaseCount, removeDocument, saveBoard, setPoc, togglePhase } from '@/features/review/state/boardModel'
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
      ? 'bg-blue-100'
      : stakeholder.color === 'amber'
        ? 'bg-amber-100'
        : stakeholder.color === 'green'
          ? 'bg-emerald-100'
          : 'bg-rose-100'
  const dotColor =
    stakeholder.color === 'blue'
      ? 'bg-blue-500'
      : stakeholder.color === 'amber'
        ? 'bg-amber-500'
        : stakeholder.color === 'green'
          ? 'bg-emerald-600'
          : 'bg-rose-500'
  const textColor =
    stakeholder.color === 'blue'
      ? 'text-blue-800'
      : stakeholder.color === 'amber'
        ? 'text-amber-800'
        : stakeholder.color === 'green'
          ? 'text-emerald-800'
          : 'text-rose-800'
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1.5">
      <div className={cn('inline-flex items-center gap-2 rounded-full px-2 py-0.5', colorBg)}>
        <span className={cn('h-2 w-2 rounded-full', dotColor)}></span>
        <span className={cn('text-[12px] font-medium', textColor)}>{stakeholder.label}</span>
      </div>
      <div className="ml-2 flex items-center gap-1">
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
              className="inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[11px] text-neutral-700 hover:bg-neutral-100"
            >
              {stakeholder.poc ? 'You' : '+ Assign POC'}
              <svg viewBox="0 0 20 20" className="h-3 w-3 text-neutral-500" aria-hidden="true">
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
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
    </div>
  )
}

const DocumentCard = (props: {
  doc: Doc
  onEdit: (values: Partial<Pick<Doc, 'title' | 'type'>>) => void
  onRemove: () => void
  dragAttributes?: DraggableAttributes
  dragListeners?: Record<string, unknown>
  transform?: string
  isOverlay?: boolean
}) => {
  const { doc, onEdit, onRemove, dragAttributes, dragListeners, transform, isOverlay } = props
  return (
    <div
      className={cn('group rounded-md border border-neutral-200 bg-white shadow-sm', isOverlay ? 'opacity-90' : undefined)}
      style={transform ? { transform } : undefined}
    >
      <div className="flex items-center justify-between px-2.5 pb-1 pt-2">
        <div className="flex items-center gap-1.5">
          <button aria-label="Drag" className="text-neutral-400 hover:text-neutral-600" {...dragAttributes} {...dragListeners}>
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-[11px] text-neutral-500">{doc.type}</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="More"
              className="rounded p-1 text-neutral-500 opacity-0 hover:bg-neutral-100 hover:text-neutral-700 focus:opacity-100 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2">
            <div className="space-y-2">
              <button className="w-full rounded px-2 py-1.5 text-left text-[13px] hover:bg-neutral-100" onClick={() => onEdit({ title: doc.title + ' (edited)' })}>
                Quick edit title
              </button>
              <button className="w-full rounded px-2 py-1.5 text-left text-[13px] text-rose-600 hover:bg-rose-50" onClick={onRemove}>
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

      <div className="mt-4 flex items-center justify-between">
        <div className="rounded-md border-2 border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-neutral-700">
          <span className="mr-6">
            <strong>Click a column header</strong> to add / remove a POC
          </span>
          <span className="mr-6">
            <strong>+ Add document</strong> adds a project-specific document
          </span>
          <span>
            <strong>Drag</strong> an item to reassign
          </span>
        </div>
        <div className="ml-2 flex items-center gap-1">
          <button aria-label="Scroll left" className="h-8 w-8 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-100" onClick={() => scrollBy(-320)}>
            <ChevronLeft className="mx-auto h-4 w-4" />
          </button>
          <button aria-label="Scroll right" className="h-8 w-8 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-100" onClick={() => scrollBy(320)}>
            <ChevronRight className="mx-auto h-4 w-4" />
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="mt-3 flex justify-end">
        <div className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-100 p-0.5 shadow-inner">
          <button className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[12px] shadow" type="button">
            <FileText className="h-3.5 w-3.5" /> Documents
          </button>
          <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-neutral-600" type="button">
            <List className="h-3.5 w-3.5" /> Criteria
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
        <div className="relative min-h-0 flex-1 overflow-x-auto" ref={scrollRef}>
          <div className="relative" style={{ minWidth: 320 * board.stakeholders.length }}>
            {/* Column headers bar */}
            <div className="flex items-center gap-3 rounded-md bg-neutral-50 p-2">
              {board.stakeholders.map((s) => (
                <div key={s.id} className="w-[320px]">
                  <ColumnHeader stakeholder={s} onSetPoc={onSetPoc} />
                </div>
              ))}
            </div>

            {/* Phases */}
            {board.phases.map((phase) => {
              const count = phaseCount(board, phase.id)
              return (
                <div key={phase.id} className="mt-3">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-1.5 text-left"
                    aria-expanded={!phase.collapsed}
                    onClick={() => setBoard((b) => togglePhase(b, phase.id))}
                  >
                    <ChevronUp className={cn('h-4 w-4 shrink-0 transition-transform', phase.collapsed ? 'rotate-180' : '')} />
                    <span className="shrink-0 rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
                      {phase.label}
                    </span>
                    <span className="ml-2 text-[12px] text-neutral-500">{phase.dateRange}</span>
                    <span className="mx-1 text-[12px] text-neutral-400">·</span>
                    <span className="text-[12px] text-neutral-500">{count} items</span>
                  </button>

                  {!phase.collapsed ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      <div className="mt-2 grid grid-cols-[repeat(var(--cols),320px)] gap-3" style={{ ['--cols' as any]: board.stakeholders.length }}>
                        {board.stakeholders.map((s) => {
                          const cell = `${phase.id}:${s.id}` as CellId
                          const items = board.cells[cell] ?? []
                          const tint =
                            s.color === 'blue'
                              ? 'bg-blue-50 border-blue-100'
                              : s.color === 'amber'
                                ? 'bg-amber-50 border-amber-100'
                                : s.color === 'green'
                                  ? 'bg-emerald-50 border-emerald-100'
                                  : 'bg-rose-50 border-rose-100'
                          const dash =
                            s.color === 'blue'
                              ? 'border-blue-200'
                              : s.color === 'amber'
                                ? 'border-amber-200'
                                : s.color === 'green'
                                  ? 'border-emerald-200'
                                  : 'border-rose-200'
                          return (
                            <div key={cell} className={cn('h-full rounded-md border p-3', tint)}>
                              <SortableContext items={items.map((d) => d.id)} strategy={rectSortingStrategy}>
                                <div className="space-y-2" id={`cell-${cell}`}>
                                  {items.map((doc) => (
                                    <SortableDocument key={doc.id} id={doc.id} doc={doc} onEdit={(vals) => handleEdit(cell, doc.id, vals)} onRemove={() => handleRemove(cell, doc.id)} />
                                  ))}
                                  <div className={cn('flex items-center gap-2 rounded-md border-2 border-dashed bg-white px-2 py-2 text-[12px] text-neutral-600', dash)}>
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1"
                                      onClick={() => {
                                        // open popover-like inline add quickly
                                        handleAdd(cell, 'Report', 'New document')
                                      }}
                                    >
                                      <span className="text-neutral-500">+</span> Add document
                                    </button>
                                  </div>
                                </div>
                              </SortableContext>
                            </div>
                          )
                        })}
                      </div>
                      <DragOverlay>{active ? <DocumentCard doc={active.doc} onEdit={() => {}} onRemove={() => {}} isOverlay /> : null}</DragOverlay>
                    </DndContext>
                  ) : null}
                </div>
              )
            })}
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
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button
          type="button"
          className="h-9 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-800"
          onClick={onNext}
          data-testid="review-next"
        >
          Next: Add stakeholders <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

