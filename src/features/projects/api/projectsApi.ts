import { baseApi } from '@/shared/api/baseApi'
import { groupCertificationRows } from '@/features/projects/lib/certificationCatalog'
import { normalizeProject, normalizeProjectList } from '@/features/projects/lib/normalizeProject'
import type { DraftApiPayload } from '@/features/projects/lib/mapProjectDraftApi'
import type { Project, Certification } from '@/features/projects/types'

type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number }

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listProjects: build.query<
      Paginated<Project>,
      { page?: number; pageSize?: number; state?: string } | void
    >({
      query: (args) => {
        const page = args?.page ?? 1
        const pageSize = args?.pageSize ?? 10
        const params = new URLSearchParams({
          limit: String(pageSize),
          offset: String((page - 1) * pageSize),
        })
        if (args?.state) params.set('state', args.state)
        return { url: `/projects?${params.toString()}` }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Project' as const, id })),
              { type: 'Projects' as const, id: 'LIST' },
            ]
          : [{ type: 'Projects' as const, id: 'LIST' }],
      transformResponse: (raw: unknown) => normalizeProjectList(raw),
    }),
    getProject: build.query<Project, string>({
      query: (id) => ({ url: `/projects/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Project', id }],
      transformResponse: (raw: unknown) =>
        normalizeProject(raw) ?? { id: '', name: '', certificationId: '' },
    }),
    createProject: build.mutation<Project, DraftApiPayload | Partial<Project>>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
      transformResponse: (raw: unknown) =>
        normalizeProject(raw) ?? { id: '', name: '', certificationId: '' },
    }),
    updateProject: build.mutation<Project, { id: string; changes: DraftApiPayload | Partial<Project> }>({
      query: ({ id, changes }) => ({ url: `/projects/${id}`, method: 'PATCH', body: changes }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Project', id },
        { type: 'Projects', id: 'LIST' },
      ],
      transformResponse: (raw: unknown) =>
        normalizeProject(raw) ?? { id: '', name: '', certificationId: '' },
    }),
    listCertifications: build.query<Certification[], void>({
      query: () => ({ url: '/projects/certifications' }),
      providesTags: ['Certifications'],
      transformResponse: (raw: unknown) => groupCertificationRows(raw),
    }),
    getCertification: build.query<Certification, string>({
      query: () => ({ url: '/projects/certifications' }),
      providesTags: (_res, _err, id) => [{ type: 'Certifications', id }],
      transformResponse: (raw: unknown, _meta, id) => {
        const grouped = groupCertificationRows(raw)
        return (
          grouped.find((item) => item.id === id) ?? {
            id,
            name: id,
            typologies: [],
          }
        )
      },
    }),
  }),
})

export const {
  useListProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useListCertificationsQuery,
  useGetCertificationQuery,
} = projectsApi
