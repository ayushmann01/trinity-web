import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { useFieldArray, type FieldErrors, type UseFormReturn } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { FormField } from '@/features/projects/components/FormField'
import { DatePicker } from '@/features/projects/components/DatePicker'
import { TimelinePreview } from '@/features/projects/components/TimelinePreview'
import {
  createEmptyMilestone,
  createEmptyOffWeek,
  createEmptySiteVisit,
  type ProjectTimelineFormValues,
} from '@/features/projects/schemas/projectTimeline'
import { PHASE_LABELS, deriveCurrentPhase } from '@/features/projects/lib/timeline'
import { cn } from '@/shared/lib/utils'

type ProjectTimelineFormProps = {
  form: UseFormReturn<ProjectTimelineFormValues>
  onBack: () => void
}

type NestedMessage = { message?: string }

function nestedError(
  errors: FieldErrors<ProjectTimelineFormValues>,
  key: 'siteVisits' | 'offWeeks' | 'otherMilestones',
  index: number,
  field: string,
): string | undefined {
  const group = errors[key] as Record<number, Record<string, NestedMessage>> | undefined
  return group?.[index]?.[field]?.message
}

export function ProjectTimelineForm({ form, onBack }: ProjectTimelineFormProps) {
  const values = form.watch()
  const {
    formState: { errors },
  } = form
  const currentPhase = deriveCurrentPhase(values)
  const siteVisits = useFieldArray({ control: form.control, name: 'siteVisits' })
  const offWeeks = useFieldArray({ control: form.control, name: 'offWeeks' })
  const otherMilestones = useFieldArray({ control: form.control, name: 'otherMilestones' })

  const setDate = (
    name:
      | 'projectStart'
      | 'designStart'
      | 'designEnd'
      | 'constructionStart'
      | 'constructionEnd'
      | 'preCertificationDeadline'
      | 'certificationDeadline',
    next: string,
  ) => {
    form.setValue(name, next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-4" data-testid="timeline-form">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border-neutral-200 p-5 shadow-none" data-testid="phases-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-neutral-900">Phases & deadlines</h2>
            {currentPhase ? (
              <span
                data-testid="current-phase-badge"
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-2.5 py-[3px] text-[11px] font-medium text-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                {PHASE_LABELS[currentPhase]}
              </span>
            ) : null}
          </div>

          <div className="space-y-4">
            <FormField
              htmlFor="projectStart"
              label="Project start"
              error={errors.projectStart?.message}
            >
              <DatePicker
                id="projectStart"
                testId="projectStart"
                aria-label="Project start"
                value={values.projectStart}
                onChange={(next) => setDate('projectStart', next)}
                invalid={Boolean(errors.projectStart)}
              />
            </FormField>

            <FormField
              label="Design phase"
              error={errors.designStart?.message || errors.designEnd?.message}
            >
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  id="designStart"
                  testId="designStart"
                  aria-label="Design phase start"
                  value={values.designStart}
                  onChange={(next) => setDate('designStart', next)}
                  invalid={Boolean(errors.designStart)}
                />
                <DatePicker
                  id="designEnd"
                  testId="designEnd"
                  aria-label="Design phase end"
                  value={values.designEnd}
                  onChange={(next) => setDate('designEnd', next)}
                  invalid={Boolean(errors.designEnd)}
                />
              </div>
            </FormField>

            <FormField
              label="Construction phase"
              error={errors.constructionStart?.message || errors.constructionEnd?.message}
            >
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  id="constructionStart"
                  testId="constructionStart"
                  aria-label="Construction phase start"
                  value={values.constructionStart}
                  onChange={(next) => setDate('constructionStart', next)}
                  invalid={Boolean(errors.constructionStart)}
                />
                <DatePicker
                  id="constructionEnd"
                  testId="constructionEnd"
                  aria-label="Construction phase end"
                  value={values.constructionEnd}
                  onChange={(next) => setDate('constructionEnd', next)}
                  invalid={Boolean(errors.constructionEnd)}
                />
              </div>
            </FormField>

            <FormField
              htmlFor="preCertificationDeadline"
              label="Pre-certification deadline"
              error={errors.preCertificationDeadline?.message}
            >
              <DatePicker
                id="preCertificationDeadline"
                testId="preCertificationDeadline"
                aria-label="Pre-certification deadline"
                value={values.preCertificationDeadline}
                onChange={(next) => setDate('preCertificationDeadline', next)}
                invalid={Boolean(errors.preCertificationDeadline)}
              />
            </FormField>

            <FormField
              htmlFor="certificationDeadline"
              label="Certification deadline"
              error={errors.certificationDeadline?.message}
            >
              <DatePicker
                id="certificationDeadline"
                testId="certificationDeadline"
                aria-label="Certification deadline"
                value={values.certificationDeadline}
                onChange={(next) => setDate('certificationDeadline', next)}
                invalid={Boolean(errors.certificationDeadline)}
              />
            </FormField>
          </div>
        </Card>

        <Card className="rounded-xl border-neutral-200 p-5 shadow-none" data-testid="milestones-card">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Other milestones</h2>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-neutral-800">Site visits</p>
              <AddButton onClick={() => siteVisits.append(createEmptySiteVisit())} testId="add-site-visit" />
            </div>
            {siteVisits.fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <DatePicker
                    testId={`siteVisit-${index}`}
                    aria-label={`Site visit ${index + 1}`}
                    value={values.siteVisits[index]?.date ?? ''}
                    onChange={(next) =>
                      form.setValue(`siteVisits.${index}.date`, next, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    invalid={Boolean(nestedError(errors, 'siteVisits', index, 'date'))}
                  />
                  {nestedError(errors, 'siteVisits', index, 'date') ? (
                    <p className="mt-1 text-xs text-destructive" role="alert">
                      {nestedError(errors, 'siteVisits', index, 'date')}
                    </p>
                  ) : null}
                </div>
                <RemoveButton onClick={() => siteVisits.remove(index)} label={`Remove site visit ${index + 1}`} />
              </div>
            ))}
          </section>

          <section className="mt-5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-neutral-800">Off-weeks / holidays</p>
                <p className="text-[11px] text-neutral-400">Excluded when calculating due dates</p>
              </div>
              <AddButton onClick={() => offWeeks.append(createEmptyOffWeek())} testId="add-off-week" />
            </div>
            {offWeeks.fields.map((field, index) => (
              <div key={field.id} className="space-y-1">
                <div className="flex items-start gap-2">
                  <DatePicker
                    testId={`offWeekStart-${index}`}
                    aria-label={`Off-week start ${index + 1}`}
                    value={values.offWeeks[index]?.start ?? ''}
                    onChange={(next) =>
                      form.setValue(`offWeeks.${index}.start`, next, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    invalid={Boolean(nestedError(errors, 'offWeeks', index, 'start'))}
                  />
                  <DatePicker
                    testId={`offWeekEnd-${index}`}
                    aria-label={`Off-week end ${index + 1}`}
                    value={values.offWeeks[index]?.end ?? ''}
                    onChange={(next) =>
                      form.setValue(`offWeeks.${index}.end`, next, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    invalid={Boolean(nestedError(errors, 'offWeeks', index, 'end'))}
                  />
                  <RemoveButton onClick={() => offWeeks.remove(index)} label={`Remove off-week ${index + 1}`} />
                </div>
                {nestedError(errors, 'offWeeks', index, 'start') ||
                nestedError(errors, 'offWeeks', index, 'end') ? (
                  <p className="text-xs text-destructive" role="alert">
                    {nestedError(errors, 'offWeeks', index, 'start') ||
                      nestedError(errors, 'offWeeks', index, 'end')}
                  </p>
                ) : null}
              </div>
            ))}
          </section>

          <section className="mt-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-neutral-800">Other</p>
              <AddButton
                onClick={() => otherMilestones.append(createEmptyMilestone())}
                testId="add-other-milestone"
              />
            </div>
            {otherMilestones.fields.map((field, index) => (
              <div key={field.id} className="space-y-1">
                <div className="flex items-start gap-2">
                  <Input
                    placeholder="Milestone name"
                    aria-label={`Milestone name ${index + 1}`}
                    className={cn(
                      'h-9 shadow-none',
                      nestedError(errors, 'otherMilestones', index, 'name') &&
                        'border-destructive focus-visible:ring-destructive',
                    )}
                    {...form.register(`otherMilestones.${index}.name`)}
                  />
                  <div className="w-[9.5rem] shrink-0">
                    <DatePicker
                      testId={`otherMilestoneDate-${index}`}
                      aria-label={`Milestone date ${index + 1}`}
                      placeholder="dd/mm/yyyy"
                      value={values.otherMilestones[index]?.date ?? ''}
                      onChange={(next) =>
                        form.setValue(`otherMilestones.${index}.date`, next, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      invalid={Boolean(nestedError(errors, 'otherMilestones', index, 'date'))}
                    />
                  </div>
                  <RemoveButton
                    onClick={() => otherMilestones.remove(index)}
                    label={`Remove milestone ${index + 1}`}
                  />
                </div>
                {nestedError(errors, 'otherMilestones', index, 'name') ||
                nestedError(errors, 'otherMilestones', index, 'date') ? (
                  <p className="text-xs text-destructive" role="alert">
                    {nestedError(errors, 'otherMilestones', index, 'name') ||
                      nestedError(errors, 'otherMilestones', index, 'date')}
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        </Card>
      </div>

      <Card className="rounded-xl border-neutral-200 p-5 shadow-none">
        <TimelinePreview values={values} />
      </Card>

      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
        <Button
          type="button"
          variant="outline"
          className="h-9 border-neutral-200 bg-white text-[13px] font-medium text-neutral-800 shadow-none"
          onClick={onBack}
          data-testid="timeline-back"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          className="h-9 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-800"
          data-testid="next-review"
        >
          Next: Review
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function AddButton({ onClick, testId }: { onClick: () => void; testId: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 border-neutral-200 bg-white px-2 text-[12px] font-medium text-neutral-800 shadow-none"
      onClick={onClick}
      data-testid={testId}
    >
      + Add
    </Button>
  )
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center text-neutral-400 hover:text-neutral-700"
    >
      <X className="h-4 w-4" />
    </button>
  )
}
