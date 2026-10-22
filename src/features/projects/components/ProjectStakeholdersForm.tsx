import { useEffect } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { useFieldArray, type FieldErrors, type UseFormReturn } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import {
  useListStakeholderBucketsQuery,
  useListStakeholderRolesQuery,
} from '@/features/stakeholders/api/stakeholdersApi'
import {
  resolveStakeholderCategories,
  resolveStakeholderRoles,
} from '@/features/projects/lib/stakeholderCatalog'
import {
  createEmptyPerson,
  type ProjectStakeholdersFormValues,
} from '@/features/projects/schemas/projectStakeholders'

type ProjectStakeholdersFormProps = {
  form: UseFormReturn<ProjectStakeholdersFormValues>
  onBack: () => void
  saving?: boolean
}

type NestedMessage = { message?: string }

function personError(
  errors: FieldErrors<ProjectStakeholdersFormValues>,
  index: number,
  field: 'email' | 'role',
): string | undefined {
  const people = errors.people as Record<number, Record<string, NestedMessage>> | undefined
  return people?.[index]?.[field]?.message
}

export function ProjectStakeholdersForm({ form, onBack, saving = false }: ProjectStakeholdersFormProps) {
  const { data: buckets, isError: bucketsFailed } = useListStakeholderBucketsQuery()
  const { data: roleCatalog, isError: rolesFailed } = useListStakeholderRolesQuery()
  const categories = resolveStakeholderCategories(bucketsFailed ? undefined : buckets)
  const roles = resolveStakeholderRoles(rolesFailed ? undefined : roleCatalog)
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'people' })
  const {
    register,
    formState: { errors },
  } = form

  useEffect(() => {
    const current = form.getValues('people')
    const missing = categories.filter(
      (category) => !current.some((person) => person.categoryId === category.id),
    )
    if (missing.length === 0) return
    form.setValue(
      'people',
      [...current, ...missing.map((category) => createEmptyPerson(category.id))],
      { shouldDirty: false },
    )
  }, [categories, form])

  return (
    <div className="space-y-4" data-testid="stakeholders-form">
      <Card className="rounded-xl border-neutral-200 p-5 shadow-none">
        <div className="space-y-5">
          {categories.map((category) => {
            const rows = fields
              .map((field, index) => ({ field, index }))
              .filter(({ field }) => field.categoryId === category.id)

            return (
              <section key={category.id} data-testid={`stakeholder-category-${category.id}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-medium text-neutral-800">{category.name}</h2>
                  <button
                    type="button"
                    className="text-[12px] font-medium text-neutral-800 hover:underline"
                    onClick={() => append(createEmptyPerson(category.id))}
                    data-testid={`add-more-${category.id}`}
                  >
                    + Add more
                  </button>
                </div>
                <div className="space-y-2">
                  {rows.map(({ field, index }, rowNumber) => {
                    const emailError = personError(errors, index, 'email')
                    const roleError = personError(errors, index, 'role')
                    const canRemove = rows.length > 1

                    return (
                      <div key={field.id} className="space-y-1">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              aria-label={`${category.name} email ${rowNumber + 1}`}
                              data-testid={`stakeholder-email-${category.id}-${rowNumber}`}
                              className={cn(
                                'h-9 shadow-none',
                                emailError && 'border-destructive focus-visible:ring-destructive',
                              )}
                              {...register(`people.${index}.email`)}
                            />
                          </div>
                          <div className="w-[11rem] shrink-0">
                            <Select
                              aria-label={`${category.name} role ${rowNumber + 1}`}
                              data-testid={`stakeholder-role-${category.id}-${rowNumber}`}
                              className={cn(
                                'wizard-select h-9 shadow-none',
                                roleError && 'border-destructive focus-visible:ring-destructive',
                              )}
                              {...register(`people.${index}.role`)}
                            >
                              <option value="">Select role</option>
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                          {canRemove ? (
                            <button
                              type="button"
                              aria-label={`Remove ${category.name} ${rowNumber + 1}`}
                              className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center text-neutral-400 hover:text-neutral-700"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                        {emailError || roleError ? (
                          <p className="text-xs text-destructive" role="alert">
                            {emailError || roleError}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
        <Button
          type="button"
          variant="outline"
          className="h-9 border-neutral-200 bg-white text-[13px] font-medium text-neutral-800 shadow-none"
          onClick={onBack}
          data-testid="stakeholders-back"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          className="h-9 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-800"
          data-testid="save-stakeholders"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save stakeholders'}
        </Button>
      </div>
    </div>
  )
}
