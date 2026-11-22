import { baseApi } from '@/shared/api/baseApi'
import type { DraftStakeholderPayload } from '@/features/projects/lib/mapProjectDraftApi'

export type Stakeholder = {
  id: string
  name: string
  email?: string
  bucketId?: string
  role?: string
  stakeholder_id?: number
  status?: string
  level?: string
  stakeholder_category?: string
}

export type StakeholderRole = {
  id: string
  name: string
}

export type StakeholderBucket = {
  id: string
  name: string
}

export const stakeholdersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listStakeholderBuckets: build.query<StakeholderBucket[], void>({
      query: () => ({ url: '/stakeholders/buckets' }),
      providesTags: ['StakeholderBuckets'],
    }),
    listStakeholderRoles: build.query<StakeholderRole[], void>({
      query: () => ({ url: '/stakeholders/roles' }),
    }),
    listStakeholders: build.query<Stakeholder[], string>({
      query: (projectId) => ({ url: `/projects/${projectId}/stakeholders` }),
      providesTags: (_res, _err, projectId) => [{ type: 'Stakeholders', id: projectId }],
      transformResponse: (raw: unknown) => {
        const list = Array.isArray(raw)
          ? raw
          : raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)
            ? ((raw as { items: unknown[] }).items)
            : []
        return list.flatMap((item) => {
          if (!item || typeof item !== 'object') return []
          const row = item as Record<string, unknown>
          const id = row.id != null ? String(row.id) : ''
          const email = typeof row.email === 'string' ? row.email : undefined
          const stakeholderId =
            typeof row.stakeholder_id === 'number'
              ? row.stakeholder_id
              : typeof row.stakeholderId === 'number'
                ? row.stakeholderId
                : undefined
          return [
            {
              id,
              name: typeof row.name === 'string' ? row.name : email?.split('@')[0] ?? '',
              email,
              bucketId: stakeholderId != null ? String(stakeholderId) : undefined,
              stakeholder_id: stakeholderId,
              status: typeof row.status === 'string' ? row.status : undefined,
              level: typeof row.level === 'string' ? row.level : undefined,
              stakeholder_category:
                typeof row.stakeholder_category === 'string' ? row.stakeholder_category : undefined,
            },
          ]
        })
      },
    }),
    createStakeholder: build.mutation<
      Stakeholder,
      { projectId: string; values: Omit<Stakeholder, 'id'> | DraftStakeholderPayload }
    >({
      query: ({ projectId, values }) => ({
        url: `/projects/${projectId}/stakeholders`,
        method: 'POST',
        body: values,
      }),
      invalidatesTags: (_res, _err, { projectId }) => [{ type: 'Stakeholders', id: projectId }],
    }),
  }),
})

export const {
  useListStakeholderBucketsQuery,
  useListStakeholderRolesQuery,
  useListStakeholdersQuery,
  useCreateStakeholderMutation,
} = stakeholdersApi
