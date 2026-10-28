import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
  emptyProjectProfile,
  type ProjectProfileFormValues,
} from '@/features/projects/schemas/projectProfile'
import {
  emptyProjectCertification,
  type ProjectCertificationFormValues,
} from '@/features/projects/schemas/projectCertification'
import {
  cloneTimeline,
  createEmptyProjectTimeline,
  emptyProjectTimeline,
  type ProjectTimelineFormValues,
} from '@/features/projects/schemas/projectTimeline'
import {
  cloneStakeholders,
  createEmptyProjectStakeholders,
  type ProjectStakeholdersFormValues,
} from '@/features/projects/schemas/projectStakeholders'
import {
  cloneScorecard,
  emptyProjectScorecard,
} from '@/features/projects/schemas/projectScorecard'
import type { ProjectScorecardDraft } from '@/features/scorecard/types'
import { mapWizardDraftToApi } from '@/features/projects/lib/mapProjectDraft'
import type { Project } from '@/features/projects/types'

export type ProjectDraftState = {
  currentStep: number
  profile: ProjectProfileFormValues
  certification: ProjectCertificationFormValues
  timeline: ProjectTimelineFormValues
  stakeholders: ProjectStakeholdersFormValues
  scorecard: ProjectScorecardDraft
  project: Partial<Project>
}

const initialState: ProjectDraftState = {
  currentStep: 1,
  profile: emptyProjectProfile,
  certification: emptyProjectCertification,
  timeline: createEmptyProjectTimeline(),
  stakeholders: createEmptyProjectStakeholders(),
  scorecard: cloneScorecard(emptyProjectScorecard),
  project: mapWizardDraftToApi(emptyProjectProfile, emptyProjectCertification, emptyProjectTimeline),
}

function syncProject(state: ProjectDraftState) {
  state.project = mapWizardDraftToApi(
    state.profile,
    state.certification,
    state.timeline ?? emptyProjectTimeline,
  )
}

export const projectDraftSlice = createSlice({
  name: 'projectDraft',
  initialState,
  reducers: {
    persistProjectDraft(
      state,
      action: PayloadAction<{
        profile?: ProjectProfileFormValues
        certification?: ProjectCertificationFormValues
        timeline?: ProjectTimelineFormValues
        stakeholders?: ProjectStakeholdersFormValues
        scorecard?: ProjectScorecardDraft
        currentStep?: number
      }>,
    ) {
      if (action.payload.profile) {
        state.profile = action.payload.profile
      }
      if (action.payload.certification) {
        state.certification = action.payload.certification
      }
      if (action.payload.timeline) {
        state.timeline = cloneTimeline(action.payload.timeline)
      }
      if (action.payload.stakeholders) {
        state.stakeholders = cloneStakeholders(action.payload.stakeholders)
      }
      if (action.payload.scorecard) {
        state.scorecard = cloneScorecard(action.payload.scorecard)
      }
      if (action.payload.currentStep != null) {
        state.currentStep = action.payload.currentStep
      }
      syncProject(state)
    },
    setWizardStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload
    },
    clearProjectDraft() {
      return initialState
    },
  },
})

export const { persistProjectDraft, setWizardStep, clearProjectDraft } = projectDraftSlice.actions
