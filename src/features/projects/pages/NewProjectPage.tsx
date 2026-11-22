import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/shared/lib/zodResolver'
import { useBlocker, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux'
import { ProjectWizardShell } from '@/features/projects/components/ProjectWizardShell'
import { ProjectProfileForm } from '@/features/projects/components/ProjectProfileForm'
import { CertificationDetailsForm } from '@/features/projects/components/CertificationDetailsForm'
import { ProjectTimelineForm } from '@/features/projects/components/ProjectTimelineForm'
import { ProjectStakeholdersForm } from '@/features/projects/components/ProjectStakeholdersForm'
import { ProjectScorecardStep } from '@/features/projects/components/ProjectScorecardStep'
import { WizardPlaceholderStep } from '@/features/projects/components/WizardPlaceholderStep'
import { UnsavedDraftDialog } from '@/features/projects/components/UnsavedDraftDialog'
import { PROJECT_SETUP_STEPS } from '@/features/projects/constants'
import { ReviewResponsibilitiesStep } from '@/features/review/components/ReviewResponsibilitiesStep'
import {
  emptyProjectProfile,
  projectProfileSchema,
  type ProjectProfileFormValues,
} from '@/features/projects/schemas/projectProfile'
import {
  emptyProjectCertification,
  projectCertificationSchema,
  type ProjectCertificationFormValues,
} from '@/features/projects/schemas/projectCertification'
import {
  cloneTimeline,
  emptyProjectTimeline,
  projectTimelineSchema,
  type ProjectTimelineFormValues,
} from '@/features/projects/schemas/projectTimeline'
import {
  cloneStakeholders,
  emptyProjectStakeholders,
  projectStakeholdersSchema,
  type ProjectStakeholdersFormValues,
} from '@/features/projects/schemas/projectStakeholders'
import {
  clearProjectDraft,
  persistProjectDraft,
} from '@/features/projects/state/projectDraftSlice'
import {
  emptyWizardSnapshot,
  generatedProjectCode,
  isWizardPath,
  mapProjectResponseToDraft,
  mapStakeholdersToDraftApi,
  mapWizardToDraftPayload,
  wizardSnapshot,
} from '@/features/projects/lib/mapProjectDraftApi'
import { apiErrorMessage, persistDraftOnServer } from '@/features/projects/lib/saveWizardDraft'
import { cloneScorecard } from '@/features/projects/schemas/projectScorecard'
import {
  useCreateProjectMutation,
  useGetProjectQuery,
  useListCertificationsQuery,
  useUpdateProjectMutation,
} from '@/features/projects/api/projectsApi'
import {
  useCreateStakeholderMutation,
  useListStakeholdersQuery,
} from '@/features/stakeholders/api/stakeholdersApi'
import {
  useGetProjectCriteriaQuery,
  useSaveProjectCriteriaMutation,
} from '@/features/scorecard/api/scorecardApi'
import type { ProjectScorecardDraft } from '@/features/scorecard/types'

function placeholderNextLabel(step: number) {
  if (step === 5) return 'Next: Stakeholders'
  return 'Next'
}

type WizardLocationState = { fromWizard?: boolean }

export function NewProjectPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const draftId = searchParams.get('draft') ?? undefined
  const fromWizard = Boolean((location.state as WizardLocationState | null)?.fromWizard)
  const draft = useAppSelector((state) => state.projectDraft)
  const currentStep = draft.currentStep
  const stepMeta = PROJECT_SETUP_STEPS.find((step) => step.id === currentStep) ?? PROJECT_SETUP_STEPS[0]
  const certificationDraft = draft.certification ?? emptyProjectCertification
  const timelineDraft = draft.timeline ?? emptyProjectTimeline
  const stakeholdersDraft = draft.stakeholders ?? emptyProjectStakeholders
  const { data: certifications } = useListCertificationsQuery()
  const { data: remoteProject, isLoading: loadingProject, isError: projectError } = useGetProjectQuery(
    draftId ?? '',
    { skip: !draftId },
  )
  const { data: remoteCriteria, isLoading: loadingCriteria } = useGetProjectCriteriaQuery(
    { projectId: draftId ?? '' },
    { skip: !draftId },
  )
  const { data: remoteStakeholders, isLoading: loadingStakeholders } = useListStakeholdersQuery(draftId ?? '', {
    skip: !draftId,
  })
  const [createProject] = useCreateProjectMutation()
  const [updateProject] = useUpdateProjectMutation()
  const [saveCriteria] = useSaveProjectCriteriaMutation()
  const [createStakeholder, { isLoading: savingStakeholders }] = useCreateStakeholderMutation()
  const [savingDraft, setSavingDraft] = useState(false)
  const [lastSaved, setLastSaved] = useState(emptyWizardSnapshot())
  const [ready, setReady] = useState(!draftId)
  const hydratedId = useRef<string | null>(null)
  const localResumeApplied = useRef(false)
  const allowLeaveRef = useRef(false)
  const existingProjectId = draft.project.id?.trim() || draftId?.trim()

  const profileForm = useForm<ProjectProfileFormValues>({
    resolver: zodResolver(projectProfileSchema),
    defaultValues: { ...emptyProjectProfile, ...draft.profile },
    mode: 'onSubmit',
  })

  const certificationForm = useForm<ProjectCertificationFormValues>({
    resolver: zodResolver(projectCertificationSchema),
    defaultValues: { ...emptyProjectCertification, ...certificationDraft },
    mode: 'onSubmit',
  })

  const timelineForm = useForm<ProjectTimelineFormValues>({
    resolver: zodResolver(projectTimelineSchema),
    defaultValues: cloneTimeline({ ...emptyProjectTimeline, ...timelineDraft }),
    mode: 'onSubmit',
  })

  const stakeholdersForm = useForm<ProjectStakeholdersFormValues>({
    resolver: zodResolver(projectStakeholdersSchema),
    defaultValues: cloneStakeholders({ ...emptyProjectStakeholders, ...stakeholdersDraft }),
    mode: 'onSubmit',
  })

  const applyLocalDraft = useCallback(
    (mapped: ReturnType<typeof mapProjectResponseToDraft>) => {
      dispatch(
        persistProjectDraft({
          profile: mapped.profile,
          certification: mapped.certification,
          timeline: mapped.timeline,
          stakeholders: mapped.stakeholders,
          scorecard: mapped.scorecard,
          currentStep: mapped.currentStep,
          project: mapped.project,
        }),
      )
      profileForm.reset(mapped.profile)
      certificationForm.reset(mapped.certification)
      timelineForm.reset(mapped.timeline)
      stakeholdersForm.reset(mapped.stakeholders)
      setLastSaved(
        wizardSnapshot({
          currentStep: mapped.currentStep,
          profile: mapped.profile,
          certification: mapped.certification,
          timeline: mapped.timeline,
          stakeholders: mapped.stakeholders,
          scorecard: mapped.scorecard,
        }),
      )
    },
    [certificationForm, dispatch, profileForm, stakeholdersForm, timelineForm],
  )

  /* Route changes reset or resume the wizard; these layout effects are the sync point. */
  /* eslint-disable react-hooks/set-state-in-effect -- hydrate/reset from the current route */
  useLayoutEffect(() => {
    if (draftId) return
    if (fromWizard) {
      if (localResumeApplied.current) {
        setReady(true)
        return
      }
      localResumeApplied.current = true
      setLastSaved(
        wizardSnapshot({
          currentStep: draft.currentStep,
          profile: profileForm.getValues(),
          certification: certificationForm.getValues(),
          timeline: cloneTimeline(timelineForm.getValues()),
          stakeholders: cloneStakeholders(stakeholdersForm.getValues()),
          scorecard: draft.scorecard,
        }),
      )
      setReady(true)
      return
    }
    dispatch(clearProjectDraft())
    profileForm.reset(emptyProjectProfile)
    certificationForm.reset(emptyProjectCertification)
    timelineForm.reset(cloneTimeline(emptyProjectTimeline))
    stakeholdersForm.reset(cloneStakeholders(emptyProjectStakeholders))
    setLastSaved(emptyWizardSnapshot())
    hydratedId.current = ''
    setReady(true)
    // draft is snapshotted once when returning from a child wizard route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificationForm, dispatch, draftId, fromWizard, profileForm, stakeholdersForm, timelineForm])

  useLayoutEffect(() => {
    if (!draftId) return
    if (hydratedId.current === draftId) {
      setReady(true)
      return
    }
    if (loadingProject || loadingCriteria || loadingStakeholders) return
    if (projectError || !remoteProject) {
      toast.error('Could not load this draft')
      setReady(true)
      return
    }
    const mapped = mapProjectResponseToDraft(remoteProject, {
      scorecard: {
        attemptedIds: remoteCriteria?.attempted_ids ?? [],
        maybeIds: remoteCriteria?.maybe_ids ?? [],
      },
      stakeholders: remoteStakeholders,
    })
    applyLocalDraft(mapped)
    hydratedId.current = draftId
    setReady(true)
  }, [
    applyLocalDraft,
    draftId,
    loadingCriteria,
    loadingProject,
    loadingStakeholders,
    projectError,
    remoteCriteria,
    remoteProject,
    remoteStakeholders,
  ])
  /* eslint-enable react-hooks/set-state-in-effect */

  const persistDraft = (step = currentStep, scorecard?: ProjectScorecardDraft) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: certificationForm.getValues(),
        timeline: cloneTimeline(timelineForm.getValues()),
        stakeholders: cloneStakeholders(stakeholdersForm.getValues()),
        scorecard: scorecard ? cloneScorecard(scorecard) : undefined,
        currentStep: step,
      }),
    )
  }

  const markClean = (step = currentStep, scorecard = draft.scorecard) => {
    const snapshot = wizardSnapshot({
      currentStep: step,
      profile: profileForm.getValues(),
      certification: certificationForm.getValues(),
      timeline: cloneTimeline(timelineForm.getValues()),
      stakeholders: cloneStakeholders(stakeholdersForm.getValues()),
      scorecard,
    })
    setLastSaved(snapshot)
    profileForm.reset(profileForm.getValues())
    certificationForm.reset(certificationForm.getValues())
    timelineForm.reset(cloneTimeline(timelineForm.getValues()))
    stakeholdersForm.reset(cloneStakeholders(stakeholdersForm.getValues()))
  }

  const saveDraft = async (
    options: { scorecard?: ProjectScorecardDraft; step?: number; attachToUrl?: boolean } = {},
  ) => {
    const step = options.step ?? currentStep
    const scorecard = options.scorecard ? cloneScorecard(options.scorecard) : cloneScorecard(draft.scorecard)
    persistDraft(step, scorecard)
    const payload = mapWizardToDraftPayload(
      profileForm.getValues(),
      certificationForm.getValues(),
      timelineForm.getValues(),
      step,
      certifications ?? [],
      { projectCode: draft.project.code, state: 'DRAFT' },
    )
    setSavingDraft(true)
    try {
      const { project, created } = await persistDraftOnServer({
        projectId: existingProjectId,
        payload,
        create: (body) => createProject(body).unwrap(),
        update: (id, body) => updateProject({ id, changes: body }).unwrap(),
        saveCriteria: (projectId, attemptedIds, maybeIds) =>
          saveCriteria({ projectId, attemptedIds, maybeIds }).unwrap(),
        scorecard: { attemptedIds: scorecard.attemptedIds, maybeIds: scorecard.maybeIds },
      })
      dispatch(
        persistProjectDraft({
          scorecard,
          currentStep: step,
          project: {
            id: project.id,
            code: project.code,
            state: project.state ?? 'DRAFT',
            draftStep: step,
            certificationDataId: project.certificationDataId ?? payload.certification_data_id,
            targetId: project.targetId ?? payload.target_id,
          },
        }),
      )
      if (options.attachToUrl !== false && (created || !draftId)) {
        hydratedId.current = project.id
        setSearchParams({ draft: project.id }, { replace: true })
      }
      markClean(step, scorecard)
      toast.success('Draft saved')
      return true
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to save draft'))
      return false
    } finally {
      setSavingDraft(false)
    }
  }

  const liveSnapshot = wizardSnapshot({
    currentStep,
    profile: profileForm.getValues(),
    certification: certificationForm.getValues(),
    timeline: cloneTimeline(timelineForm.getValues()),
    stakeholders: cloneStakeholders(stakeholdersForm.getValues()),
    scorecard: draft.scorecard,
  })
  const formsDirty =
    profileForm.formState.isDirty ||
    certificationForm.formState.isDirty ||
    timelineForm.formState.isDirty ||
    stakeholdersForm.formState.isDirty
  const dirty = ready && (formsDirty || liveSnapshot !== lastSaved)

  const blocker = useBlocker(
    ({ nextLocation }) => !allowLeaveRef.current && dirty && !isWizardPath(nextLocation.pathname),
  )

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const handleSaveDraft = () => {
    void saveDraft()
  }

  const handleExit = () => {
    navigate('/app/projects')
  }

  const handleLeaveSave = async () => {
    allowLeaveRef.current = true
    const saved = await saveDraft({ attachToUrl: false })
    if (saved) {
      blocker.proceed?.()
      return
    }
    allowLeaveRef.current = false
  }

  const handleLeaveDiscard = () => {
    allowLeaveRef.current = true
    dispatch(clearProjectDraft())
    blocker.proceed?.()
  }

  const handleProfileNext = profileForm.handleSubmit((values) => {
    dispatch(
      persistProjectDraft({
        profile: values,
        certification: certificationForm.getValues(),
        timeline: timelineForm.getValues(),
        stakeholders: stakeholdersForm.getValues(),
        currentStep: 2,
      }),
    )
  })

  const handleCertificationNext = certificationForm.handleSubmit((values) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: values,
        timeline: timelineForm.getValues(),
        stakeholders: stakeholdersForm.getValues(),
        scorecard: cloneScorecard(draft.scorecard),
        currentStep: 3,
      }),
    )
  })

  const handleScorecardNext = (scorecard: ProjectScorecardDraft) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: certificationForm.getValues(),
        timeline: timelineForm.getValues(),
        stakeholders: stakeholdersForm.getValues(),
        scorecard: cloneScorecard(scorecard),
        currentStep: 4,
      }),
    )
  }

  const handleScorecardSave = (scorecard: ProjectScorecardDraft) => {
    void saveDraft({ scorecard })
  }

  const handleTimelineNext = timelineForm.handleSubmit((values) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: certificationForm.getValues(),
        timeline: values,
        stakeholders: stakeholdersForm.getValues(),
        currentStep: 5,
      }),
    )
  })

  const handleSaveStakeholders = (event: FormEvent<HTMLFormElement>) => {
    void stakeholdersForm.handleSubmit(async (values) => {
      persistDraft(6)
      const code = draft.project.code || generatedProjectCode()
      const payload = mapWizardToDraftPayload(
        profileForm.getValues(),
        certificationForm.getValues(),
        timelineForm.getValues(),
        6,
        certifications ?? [],
        { projectCode: code, state: 'DRAFT' },
      )

      setSavingDraft(true)
      try {
        const { project } = await persistDraftOnServer({
          projectId: existingProjectId,
          payload,
          create: (body) => createProject(body).unwrap(),
          update: (id, body) => updateProject({ id, changes: body }).unwrap(),
          saveCriteria: (projectId, attemptedIds, maybeIds) =>
            saveCriteria({ projectId, attemptedIds, maybeIds }).unwrap(),
          scorecard: {
            attemptedIds: draft.scorecard.attemptedIds,
            maybeIds: draft.scorecard.maybeIds,
          },
        })

        const people = mapStakeholdersToDraftApi(values)
        if (people.length > 0) {
          await Promise.all(
            people.map((person) => createStakeholder({ projectId: project.id, values: person }).unwrap()),
          )
        }

        const published = await updateProject({
          id: project.id,
          changes: { ...payload, project_id: code, state: 'CREATED' },
        }).unwrap()

        allowLeaveRef.current = true
        dispatch(clearProjectDraft())
        markClean(6)
        toast.success('Project published')
        navigate(`/app/projects/${published.id || project.id}`)
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Failed to publish project'))
      } finally {
        setSavingDraft(false)
      }
    })(event)
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-neutral-500" data-testid="draft-loading">
        Loading draft…
      </div>
    )
  }

  return (
    <ProjectWizardShell
      currentStep={currentStep}
      onStepChange={(step) => persistDraft(step)}
      onSaveDraft={handleSaveDraft}
      onExit={handleExit}
      savingDraft={savingDraft}
      fillHeight={currentStep === 3 || currentStep === 5}
      contentClassName={currentStep === 4 ? 'max-w-[1100px]' : currentStep === 5 ? 'max-w-[1400px]' : undefined}
    >
      {currentStep === 1 ? (
        <form onSubmit={handleProfileNext} noValidate>
          <p className="text-[12px] text-neutral-400">Step 1 of 6</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
            {stepMeta.pageTitle}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-neutral-500">{stepMeta.subtitle}</p>
          <ProjectProfileForm form={profileForm} />
          <div className="mt-6 flex justify-end border-t border-neutral-200 pt-6">
            <Button
              type="submit"
              className="h-9 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-800"
              data-testid="next-certification"
            >
              Certification Information
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </form>
      ) : currentStep === 2 ? (
        <form onSubmit={handleCertificationNext} noValidate>
          <p className="text-[12px] text-neutral-400">Step 2 of 6</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
            {stepMeta.pageTitle}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-neutral-500">{stepMeta.subtitle}</p>
          <CertificationDetailsForm form={certificationForm} onBack={() => persistDraft(1)} />
        </form>
      ) : currentStep === 3 ? (
        <ProjectScorecardStep
          onBack={() => persistDraft(2)}
          onNext={handleScorecardNext}
          onSaveDraft={handleScorecardSave}
        />
      ) : currentStep === 4 ? (
        <form onSubmit={handleTimelineNext} noValidate>
          <p className="text-[12px] text-neutral-400">Step 4 of 6</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
            {stepMeta.pageTitle}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-neutral-500">{stepMeta.subtitle}</p>
          <ProjectTimelineForm form={timelineForm} onBack={() => persistDraft(3)} />
        </form>
      ) : currentStep === 6 ? (
        <form onSubmit={handleSaveStakeholders} noValidate>
          <p className="text-[12px] text-neutral-400">Step 6 of 6 · Optional</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
            {stepMeta.pageTitle}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-neutral-500">{stepMeta.subtitle}</p>
          <ProjectStakeholdersForm
            form={stakeholdersForm}
            onBack={() => persistDraft(5)}
            saving={savingStakeholders || savingDraft}
          />
        </form>
      ) : currentStep === 5 ? (
        <ReviewResponsibilitiesStep onBack={() => persistDraft(4)} onNext={() => persistDraft(6)} />
      ) : (
        <WizardPlaceholderStep
          step={currentStep}
          onBack={() => persistDraft(Math.max(1, currentStep - 1))}
          onNext={currentStep < 6 ? () => persistDraft(Math.min(6, currentStep + 1)) : undefined}
          nextLabel={placeholderNextLabel(currentStep)}
        />
      )}
      <UnsavedDraftDialog
        open={blocker.state === 'blocked'}
        saving={savingDraft}
        onSaveDraft={() => {
          void handleLeaveSave()
        }}
        onDiscard={handleLeaveDiscard}
        onCancel={() => blocker.reset?.()}
      />
    </ProjectWizardShell>
  )
}
