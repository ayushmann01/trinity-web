import { format } from 'date-fns'

export type TimelineDateFields = {
  projectStart: string
  designStart: string
  designEnd: string
  constructionStart: string
  constructionEnd: string
  preCertificationDeadline: string
  certificationDeadline: string
  siteVisits: { id: string; date: string }[]
  offWeeks: { id: string; start: string; end: string }[]
  otherMilestones: { id: string; name: string; date: string }[]
}

export type TimelinePhaseId =
  | 'scoping'
  | 'design'
  | 'post-design'
  | 'construction'
  | 'post-construction'

export const PHASE_LABELS: Record<TimelinePhaseId, string> = {
  scoping: 'Scoping Phase',
  design: 'Design Phase',
  'post-design': 'Post-Design Phase',
  construction: 'Construction Phase',
  'post-construction': 'Post-Construction Phase',
}

export const GANTT_PHASES: { id: TimelinePhaseId; label: string }[] = [
  { id: 'scoping', label: PHASE_LABELS.scoping },
  { id: 'design', label: PHASE_LABELS.design },
  { id: 'post-design', label: PHASE_LABELS['post-design'] },
  { id: 'construction', label: PHASE_LABELS.construction },
  { id: 'post-construction', label: PHASE_LABELS['post-construction'] },
]

export function parseIsoDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined
  }
  return date
}

export function isValidIsoDate(value: string): boolean {
  return Boolean(parseIsoDate(value))
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return ''
  return format(date, 'dd MMM yyyy')
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function startOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

export function collectTimelineDates(values: TimelineDateFields): Date[] {
  const raw = [
    values.projectStart,
    values.designStart,
    values.designEnd,
    values.constructionStart,
    values.constructionEnd,
    values.preCertificationDeadline,
    values.certificationDeadline,
    ...values.siteVisits.map((visit) => visit.date),
    ...values.offWeeks.flatMap((week) => [week.start, week.end]),
    ...values.otherMilestones.map((milestone) => milestone.date),
  ]
  return raw.map((value) => parseIsoDate(value)).filter((date): date is Date => Boolean(date))
}

export function buildGanttRange(dates: Date[], now = new Date()): { start: Date; end: Date } {
  if (dates.length === 0) {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
    }
  }
  const min = dates.reduce((earliest, date) => (date < earliest ? date : earliest))
  const max = dates.reduce((latest, date) => (date > latest ? date : latest))
  return { start: startOfMonth(min), end: startOfNextMonth(max) }
}

export function dateToPercent(date: Date, rangeStart: Date, rangeEnd: Date): number {
  const total = rangeEnd.getTime() - rangeStart.getTime()
  if (total <= 0) return 0
  const raw = ((date.getTime() - rangeStart.getTime()) / total) * 100
  return Math.min(100, Math.max(0, raw))
}

export function barPosition(
  start: Date,
  endExclusive: Date,
  rangeStart: Date,
  rangeEnd: Date,
): { left: number; width: number } {
  const left = dateToPercent(start, rangeStart, rangeEnd)
  const right = dateToPercent(endExclusive, rangeStart, rangeEnd)
  return { left, width: Math.max(0, right - left) }
}

export type GanttMonth = {
  key: string
  label: string
  left: number
  width: number
}

export function buildMonthTicks(rangeStart: Date, rangeEnd: Date): GanttMonth[] {
  const months: GanttMonth[] = []
  let cursor = startOfMonth(rangeStart)
  while (cursor < rangeEnd) {
    const next = startOfNextMonth(cursor)
    const left = dateToPercent(cursor, rangeStart, rangeEnd)
    const width = dateToPercent(next, rangeStart, rangeEnd) - left
    const isFirst = months.length === 0
    const isJanuary = cursor.getMonth() === 0
    const label =
      isFirst || isJanuary
        ? format(cursor, "MMM ''yy")
        : format(cursor, 'MMM')
    months.push({
      key: toIsoDate(cursor),
      label,
      left,
      width,
    })
    cursor = next
  }
  return months
}

export function deriveCurrentPhase(
  values: Pick<
    TimelineDateFields,
    | 'projectStart'
    | 'designStart'
    | 'designEnd'
    | 'constructionStart'
    | 'constructionEnd'
    | 'certificationDeadline'
  >,
  todayInput = new Date(),
): TimelinePhaseId | null {
  const today = startOfDay(todayInput)
  const projectStart = parseIsoDate(values.projectStart)
  const designStart = parseIsoDate(values.designStart)
  const designEnd = parseIsoDate(values.designEnd)
  const constructionStart = parseIsoDate(values.constructionStart)
  const constructionEnd = parseIsoDate(values.constructionEnd)
  const certDeadline = parseIsoDate(values.certificationDeadline)

  if (projectStart && designStart && today >= projectStart && today < designStart) {
    return 'scoping'
  }
  if (designStart && designEnd && today >= designStart && today <= designEnd) {
    return 'design'
  }
  if (designEnd && constructionStart && today > designEnd && today < constructionStart) {
    return 'post-design'
  }
  if (
    constructionStart &&
    constructionEnd &&
    today >= constructionStart &&
    today <= constructionEnd
  ) {
    return 'construction'
  }
  if (constructionEnd && certDeadline && today > constructionEnd && today <= certDeadline) {
    return 'post-construction'
  }
  return null
}

export type GanttBar = {
  id: TimelinePhaseId
  label: string
  left: number
  width: number
}

export type GanttMarker = {
  id: string
  type: 'milestone' | 'pre-cert' | 'cert'
  percent: number
}

export type GanttModel = {
  rangeStart: Date
  rangeEnd: Date
  months: GanttMonth[]
  bars: GanttBar[]
  markers: GanttMarker[]
  currentPhase: TimelinePhaseId | null
}

function maybeBar(
  id: TimelinePhaseId,
  start: Date | undefined,
  endExclusive: Date | undefined,
  rangeStart: Date,
  rangeEnd: Date,
): GanttBar | undefined {
  if (!start || !endExclusive || endExclusive.getTime() <= start.getTime()) return undefined
  const position = barPosition(start, endExclusive, rangeStart, rangeEnd)
  if (position.width <= 0) return undefined
  return { id, label: PHASE_LABELS[id], ...position }
}

export function buildGanttModel(values: TimelineDateFields, now = new Date()): GanttModel {
  const dates = collectTimelineDates(values)
  const range = buildGanttRange(dates, now)
  const projectStart = parseIsoDate(values.projectStart)
  const designStart = parseIsoDate(values.designStart)
  const designEnd = parseIsoDate(values.designEnd)
  const constructionStart = parseIsoDate(values.constructionStart)
  const constructionEnd = parseIsoDate(values.constructionEnd)
  const preCert = parseIsoDate(values.preCertificationDeadline)
  const certDeadline = parseIsoDate(values.certificationDeadline)

  const bars = [
    maybeBar('scoping', projectStart, designStart, range.start, range.end),
    maybeBar(
      'design',
      designStart,
      designEnd ? addDays(designEnd, 1) : undefined,
      range.start,
      range.end,
    ),
    maybeBar(
      'post-design',
      designEnd ? addDays(designEnd, 1) : undefined,
      constructionStart,
      range.start,
      range.end,
    ),
    maybeBar(
      'construction',
      constructionStart,
      constructionEnd ? addDays(constructionEnd, 1) : undefined,
      range.start,
      range.end,
    ),
    maybeBar(
      'post-construction',
      constructionEnd ? addDays(constructionEnd, 1) : undefined,
      certDeadline ? addDays(certDeadline, 1) : undefined,
      range.start,
      range.end,
    ),
  ].filter((bar): bar is GanttBar => Boolean(bar))

  const markers: GanttMarker[] = []
  values.siteVisits.forEach((visit, index) => {
    const date = parseIsoDate(visit.date)
    if (!date) return
    markers.push({
      id: `site-${index}`,
      type: 'milestone',
      percent: dateToPercent(date, range.start, range.end),
    })
  })
  values.otherMilestones.forEach((milestone, index) => {
    const date = parseIsoDate(milestone.date)
    if (!date) return
    markers.push({
      id: `other-${index}`,
      type: 'milestone',
      percent: dateToPercent(date, range.start, range.end),
    })
  })
  if (preCert) {
    markers.push({
      id: 'pre-cert',
      type: 'pre-cert',
      percent: dateToPercent(preCert, range.start, range.end),
    })
  }
  if (certDeadline) {
    markers.push({
      id: 'cert',
      type: 'cert',
      percent: dateToPercent(certDeadline, range.start, range.end),
    })
  }

  return {
    rangeStart: range.start,
    rangeEnd: range.end,
    months: buildMonthTicks(range.start, range.end),
    bars,
    markers,
    currentPhase: deriveCurrentPhase(values, now),
  }
}
