import { describe, expect, it } from 'vitest'
import { persistConfig, setupStore } from '@/app/store'
import {
  clearProjectDraft,
  persistProjectDraft,
  setWizardStep,
} from '@/features/projects/state/projectDraftSlice'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { mapProjectProfileToApi } from '@/features/projects/lib/mapProjectProfile'

describe('projectDraftSlice', () => {
  it('is persisted so drafts survive reload', () => {
    expect(persistConfig.whitelist).toContain('projectDraft')
  })

  it('stores form values and the current wizard step', () => {
    const store = setupStore()
    store.dispatch(
      persistProjectDraft({
        currentStep: 2,
        profile: { ...emptyProjectProfile, name: 'Harbor Campus', location: 'Chennai' },
      }),
    )

    expect(store.getState().projectDraft.currentStep).toBe(2)
    expect(store.getState().projectDraft.profile.name).toBe('Harbor Campus')
    expect(store.getState().projectDraft.profile.location).toBe('Chennai')
    expect(store.getState().projectDraft.project).toMatchObject({
      name: 'Harbor Campus',
      location: 'Chennai',
    })
  })

  it('hydrates a new store from previously saved draft state', () => {
    const profile = { ...emptyProjectProfile, name: 'Reloaded Project', plotArea: '900' }
    const saved = {
      currentStep: 1,
      profile,
      project: mapProjectProfileToApi(profile),
    }
    const store = setupStore({ projectDraft: saved })
    expect(store.getState().projectDraft.profile.name).toBe('Reloaded Project')
    expect(store.getState().projectDraft.profile.plotArea).toBe('900')
  })

  it('updates the step and can reset the draft', () => {
    const store = setupStore()
    store.dispatch(setWizardStep(4))
    expect(store.getState().projectDraft.currentStep).toBe(4)
    store.dispatch(clearProjectDraft())
    expect(store.getState().projectDraft.currentStep).toBe(1)
    expect(store.getState().projectDraft.profile).toEqual(emptyProjectProfile)
    expect(store.getState().projectDraft.project.name).toBe('')
  })
})
