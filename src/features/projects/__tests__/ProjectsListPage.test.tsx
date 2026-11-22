import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithStore } from '@/test/utils'
import { ProjectsListPage } from '@/features/projects/pages/ProjectsListPage'

const items = [
  {
    id: 'active-1',
    name: 'Published Hall',
    state: 'CREATED',
    certificationId: 'griha',
    certificationTitle: 'GRIHA',
    targetRating: '4 Star',
  },
  {
    id: 'draft-1',
    name: 'Harbor Campus',
    state: 'DRAFT',
    certificationId: '',
  },
]

vi.mock('@/features/projects/api/projectsApi', () => ({
  useListProjectsQuery: () => ({
    data: { items, total: 2, page: 1, pageSize: 10 },
    isLoading: false,
  }),
}))

describe('ProjectsListPage', () => {
  it('shows a Draft badge and resumes the wizard from a draft row', () => {
    renderWithStore(<ProjectsListPage />, { route: '/app/projects' })

    expect(screen.getByTestId('draft-badge-draft-1')).toHaveTextContent('Draft')
    expect(screen.queryByTestId('draft-badge-active-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('draft-link-draft-1')).toHaveAttribute(
      'href',
      '/projects/new?draft=draft-1',
    )
    expect(screen.getByTestId('continue-draft-draft-1')).toHaveAttribute(
      'href',
      '/projects/new?draft=draft-1',
    )
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/app/projects/active-1')
  })
})
