import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import {
  ScorecardTree,
  SelectedCriterionHeader,
} from '@/features/scorecard/components/ScorecardTree'
import type { CriteriaNode } from '@/features/scorecard/types'

function node(overrides: Partial<CriteriaNode> & { id: number; title: string }): CriteriaNode {
  return {
    parent_id: overrides.parent_id ?? overrides.id,
    criteria_id: overrides.criteria_id ?? `P${overrides.id}`,
    description: null,
    section: null,
    max_points: 1,
    points_attempted: 0,
    points_maybe: 0,
    criteria_status: 'MAXIMUM',
    criteria_category: 'CRITERIA',
    criteria_state: 'ROOT',
    typology: 'ALL',
    footnotes: null,
    references: null,
    rules: null,
    mandatory: false,
    selectable: false,
    attempted: false,
    attempt_state: 'NO',
    pr_stakeholder_id: null,
    sc_stakeholder_id: null,
    tr_stakeholder_id: null,
    calculator_id: null,
    children: [],
    ...overrides,
  }
}

function renderPanel(root: CriteriaNode) {
  return render(
    <>
      <SelectedCriterionHeader node={root} />
      <ScorecardTree
        criteria={[root]}
        notes={{}}
        expandedNotes={new Set()}
        onToggle={vi.fn()}
        onNoteChange={vi.fn()}
        onToggleNote={vi.fn()}
        isInactive={() => false}
        selectedId={root.id}
      />
    </>,
  )
}

describe('ScorecardTree detail actions', () => {
  it('shows Calculator only when calculator_id has a real id', () => {
    const withCalc = node({
      id: 1,
      title: 'Government Approved Plans',
      criteria_id: 'P1',
      calculator_id: ['C-P01-01'],
      children: [node({ id: 11, parent_id: 1, criteria_id: 'P1', title: 'Aim', mandatory: true })],
    })
    const { unmount } = renderPanel(withCalc)
    expect(screen.getByTestId('calculator-1')).toBeInTheDocument()
    unmount()

    renderPanel(
      node({
        id: 1,
        title: 'Government Approved Plans',
        criteria_id: 'P1',
        calculator_id: ['', ' '],
        children: [node({ id: 11, parent_id: 1, criteria_id: 'P1', title: 'Aim', mandatory: true })],
      }),
    )
    expect(screen.queryByTestId('calculator-1')).not.toBeInTheDocument()
  })

  it('shows References only when references is a non-empty value', () => {
    const withRefs = node({
      id: 1,
      title: 'Government Approved Plans',
      criteria_id: 'P1',
      references: 'https://www.grihaindia.org',
      children: [
        node({
          id: 11,
          parent_id: 1,
          criteria_id: 'P1',
          title: 'Aim',
          mandatory: true,
          references: null,
        }),
      ],
    })
    const { unmount } = renderPanel(withRefs)
    expect(screen.getByTestId('references-1')).toBeInTheDocument()
    expect(screen.queryByTestId('references-11')).not.toBeInTheDocument()
    unmount()

    renderPanel(
      node({
        id: 1,
        title: 'Government Approved Plans',
        criteria_id: 'P1',
        references: '',
        children: [node({ id: 11, parent_id: 1, criteria_id: 'P1', title: 'Aim', mandatory: true })],
      }),
    )
    expect(screen.queryByTestId('references-1')).not.toBeInTheDocument()
  })

  it('keeps the panel title and does not repeat the selected criterion as a tree heading', () => {
    renderPanel(
      node({
        id: 1,
        title: 'Government Approved Plans',
        criteria_id: 'P1',
        mandatory: false,
        children: [
          node({
            id: 11,
            parent_id: 1,
            criteria_id: 'P1',
            title: 'Aim',
            mandatory: true,
            selectable: true,
          }),
        ],
      }),
    )

    const header = screen.getByTestId('selected-criterion-header')
    expect(header).toHaveTextContent('P1')
    expect(header).toHaveTextContent('Government Approved Plans')
    expect(within(header).queryByText(/mandatory/i)).not.toBeInTheDocument()

    expect(
      within(screen.getByTestId('scorecard-tree')).queryByRole('heading', {
        name: 'Government Approved Plans',
      }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('criterion-11')).toHaveTextContent('Aim')
    expect(screen.getByTestId('criterion-11')).toHaveTextContent('Mandatory')
  })
})
