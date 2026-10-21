import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
  emptyProjectProfile,
  type ProjectProfileFormValues,
} from '@/features/projects/schemas/projectProfile'
import { mapProjectProfileToApi } from '@/features/projects/lib/mapProjectProfile'
import type { Project } from '@/features/projects/types'

export type ProjectDraftState = {
  currentStep: number
  profile: ProjectProfileFormValues
  project: Partial<Project>
}

const initialState: ProjectDraftState = {
  currentStep: 1,
  profile: emptyProjectProfile,
  project: mapProjectProfileToApi(emptyProjectProfile),
}

export const projectDraftSlice = createSlice({
  name: 'projectDraft',
  initialState,
  reducers: {
    persistProjectDraft(
      state,
      action: PayloadAction<{ profile?: ProjectProfileFormValues; currentStep?: number }>,
    ) {
      if (action.payload.profile) {
        state.profile = action.payload.profile
        state.project = mapProjectProfileToApi(action.payload.profile)
      }
      if (action.payload.currentStep != null) {
        state.currentStep = action.payload.currentStep
      }
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
