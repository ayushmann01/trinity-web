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
import { mapWizardDraftToApi } from '@/features/projects/lib/mapProjectDraft'
import type { Project } from '@/features/projects/types'

export type ProjectDraftState = {
  currentStep: number
  profile: ProjectProfileFormValues
  certification: ProjectCertificationFormValues
  project: Partial<Project>
}

const initialState: ProjectDraftState = {
  currentStep: 1,
  profile: emptyProjectProfile,
  certification: emptyProjectCertification,
  project: mapWizardDraftToApi(emptyProjectProfile, emptyProjectCertification),
}

function syncProject(state: ProjectDraftState) {
  state.project = mapWizardDraftToApi(state.profile, state.certification)
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
        currentStep?: number
      }>,
    ) {
      if (action.payload.profile) {
        state.profile = action.payload.profile
      }
      if (action.payload.certification) {
        state.certification = action.payload.certification
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
