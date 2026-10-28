import type { CriteriaRecord, CriteriaState } from '@/features/scorecard/types'

export type CatalogDraft = {
  id: number
  criteria_id?: string | null
  title?: string | null
  description?: string | null
  section?: string | null
  max_points?: number
  criteria_status?: string
  criteria_state: CriteriaState
  typology?: string | null
  footnotes?: string | null
  references?: string | null
  rules?: Record<string, number> | null
  children?: CatalogDraft[]
}

export function materializeCatalog(drafts: CatalogDraft[]): CriteriaRecord[] {
  const rows: CriteriaRecord[] = []

  const walk = (draft: CatalogDraft, parentId?: number) => {
    const parent_id = parentId ?? draft.id
    rows.push({
      id: draft.id,
      parent_id,
      criteria_id: draft.criteria_id ?? null,
      title: draft.title ?? null,
      description: draft.description ?? null,
      max_points: draft.max_points ?? 0,
      criteria_status: draft.criteria_status ?? 'MAXIMUM',
      pr_stakeholder_id: null,
      sc_stakeholder_id: null,
      tr_stakeholder_id: null,
      references: draft.references ?? null,
      criteria_category: 'CRITERIA',
      section: draft.section ?? null,
      typology: draft.typology ?? 'ALL',
      criteria_state: draft.criteria_state,
      footnotes: draft.footnotes ?? null,
      rules: draft.rules ?? null,
    })
    for (const child of draft.children ?? []) {
      walk(child, draft.id)
    }
  }

  for (const draft of drafts) walk(draft)
  return rows
}
