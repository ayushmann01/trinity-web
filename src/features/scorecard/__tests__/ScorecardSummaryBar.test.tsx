import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScorecardSummaryBar } from '@/features/scorecard/components/ScorecardSummaryBar'

function renderBar(
  overrides: Partial<{
    yesPoints: number
    maybePoints: number
    totalPoints: number
    activeThresholdId: string | null
  }> = {},
) {
  return render(
    <ScorecardSummaryBar
      certificationName="GRIHA"
      subtitle="Build your credit plan"
      collapsed={false}
      onToggleCollapsed={vi.fn()}
      yesPoints={0}
      maybePoints={1}
      totalPoints={100}
      {...overrides}
    />,
  )
}

describe('ScorecardSummaryBar', () => {
  it('headlines yes plus maybe over the scale and keeps the Yes/Maybe legend split', () => {
    renderBar()

    expect(screen.getByTestId('scorecard-total')).toHaveTextContent('1 / 100 pts')
    expect(screen.getByText('Yes 0 pts')).toBeInTheDocument()
    expect(screen.getByText('Maybe 1 pts')).toBeInTheDocument()
    expect(screen.getByTestId('scorecard-progress')).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByTestId('progress-maybe')).toHaveStyle({ width: '1%' })
  })

  it('uses the combined total for rating chips and the progress fill', () => {
    renderBar({ yesPoints: 20, maybePoints: 10 })

    expect(screen.getByTestId('scorecard-total')).toHaveTextContent('30 / 100 pts')
    expect(screen.getByTestId('scorecard-progress')).toHaveAttribute('aria-valuenow', '30')
    expect(screen.getByTestId('progress-yes')).toHaveStyle({ width: '20%' })
    expect(screen.getByTestId('progress-maybe')).toHaveStyle({ width: '10%' })
    expect(screen.getByText('Certified 25pts')).toHaveClass('bg-neutral-200')
    expect(screen.getByText('Silver 50pts')).toHaveClass('bg-neutral-100')
  })
})
