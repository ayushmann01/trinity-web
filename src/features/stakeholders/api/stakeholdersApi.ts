import { baseApi } from '@/shared/api/baseApi'

export type Stakeholder = {
  id: string
  name: string
  email?: string
  bucketId?: string
  role?: string
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
    }),
    createStakeholder: build.mutation<
      Stakeholder,
      { projectId: string; values: Omit<Stakeholder, 'id'> }
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
