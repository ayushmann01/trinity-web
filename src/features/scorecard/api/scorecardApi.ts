import { baseApi } from '@/shared/api/baseApi'
import type { ProjectCriteriaResponse, Scorecard } from '@/features/scorecard/types'

export const scorecardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getScorecard: build.query<Scorecard, { projectId: string }>({
      query: ({ projectId }) => ({ url: `/projects/${projectId}/scorecard` }),
      providesTags: (_res, _err, { projectId }) => [{ type: 'Scorecard', id: projectId }],
    }),
    saveScorecard: build.mutation<
      { ok: boolean },
      { projectId: string; attemptedIds: string[]; maybeIds: string[] }
    >({
      query: ({ projectId, attemptedIds, maybeIds }) => ({
        url: `/projects/${projectId}/scorecard`,
        method: 'POST',
        body: { attempted_ids: attemptedIds, maybe_ids: maybeIds },
      }),
      invalidatesTags: (_res, _err, { projectId }) => [{ type: 'Scorecard', id: projectId }],
    }),
    getProjectCriteria: build.query<ProjectCriteriaResponse, { projectId: string }>({
      query: ({ projectId }) => ({ url: `/projects/${projectId}/criteria` }),
      providesTags: (_res, _err, { projectId }) => [{ type: 'Scorecard', id: `${projectId}-criteria` }],
    }),
    saveProjectCriteria: build.mutation<
      ProjectCriteriaResponse,
      { projectId: string; attemptedIds: number[]; maybeIds: number[] }
    >({
      query: ({ projectId, attemptedIds, maybeIds }) => ({
        url: `/projects/${projectId}/criteria`,
        method: 'POST',
        body: { attempted_ids: attemptedIds, maybe_ids: maybeIds },
      }),
      invalidatesTags: (_res, _err, { projectId }) => [
        { type: 'Scorecard', id: projectId },
        { type: 'Scorecard', id: `${projectId}-criteria` },
      ],
    }),
  }),
})

export const {
  useGetScorecardQuery,
  useSaveScorecardMutation,
  useGetProjectCriteriaQuery,
  useSaveProjectCriteriaMutation,
} = scorecardApi
