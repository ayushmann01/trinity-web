import { baseApi } from '@/shared/api/baseApi'
import type { Project, Certification } from '@/features/projects/types'

type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number }

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listProjects: build.query<
      Paginated<Project>,
      { page?: number; pageSize?: number } | void
    >({
      query: (args) => {
        const p = args?.page ?? 1
        const ps = args?.pageSize ?? 10
        return { url: `/projects?page=${p}&pageSize=${ps}` }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Project' as const, id })),
              { type: 'Projects' as const, id: 'LIST' },
            ]
          : [{ type: 'Projects' as const, id: 'LIST' }],
      transformResponse: (raw: unknown) => {
        let items: Project[] = []
        let total = 0
        let page = 1
        let pageSize = 10
        if (Array.isArray(raw)) {
          items = raw as Project[]
        } else if (raw && typeof raw === 'object') {
          const obj = raw as Partial<Paginated<Project>>
          items = obj.items ?? []
          total = obj.total ?? 0
          page = obj.page ?? 1
          pageSize = obj.pageSize ?? 10
        }
        return { items, total, page, pageSize }
      },
    }),
    getProject: build.query<Project, string>({
      query: (id) => ({ url: `/projects/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Project', id }],
    }),
    createProject: build.mutation<Project, Partial<Project>>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
    }),
    updateProject: build.mutation<Project, { id: string; changes: Partial<Project> }>({
      query: ({ id, changes }) => ({ url: `/projects/${id}`, method: 'PUT', body: changes }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Project', id },
        { type: 'Projects', id: 'LIST' },
      ],
    }),
    listCertifications: build.query<Certification[], void>({
      query: () => ({ url: '/catalog/certifications' }),
      providesTags: ['Certifications'],
    }),
    getCertification: build.query<Certification, string>({
      query: (id) => ({ url: `/catalog/certifications/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Certifications', id }],
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
