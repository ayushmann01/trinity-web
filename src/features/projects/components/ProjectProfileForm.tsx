import { Lock } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { useMemo } from 'react'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'
import { useListCertificationsQuery } from '@/features/projects/api/projectsApi'
import { CLIMATE_ZONES, DEFAULT_TYPOLOGIES } from '@/features/projects/constants'
import { FormField } from '@/features/projects/components/FormField'
import { AreaInput } from '@/features/projects/components/AreaInput'
import type { ProjectProfileFormValues } from '@/features/projects/schemas/projectProfile'

type ProjectProfileFormProps = {
  form: UseFormReturn<ProjectProfileFormValues>
}

export function ProjectProfileForm({ form }: ProjectProfileFormProps) {
  const { data: certifications } = useListCertificationsQuery()
  const {
    register,
    formState: { errors },
  } = form

  const typologies = useMemo(() => {
    const fromApi =
      certifications?.flatMap((certification) => certification.typologies ?? []) ?? []
    const unique = new Map(fromApi.map((item) => [item.id, item]))
    if (unique.size > 0) return Array.from(unique.values())
    return DEFAULT_TYPOLOGIES.map((item) => ({ id: item.id, name: item.name }))
  }, [certifications])

  const inputClass = (invalid?: boolean) =>
    cn('h-9 shadow-none', invalid && 'border-destructive focus-visible:ring-destructive')

  return (
    <div className="space-y-5">
      <div
        className="flex gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-[13px] leading-snug text-neutral-600"
        data-testid="info-banner"
      >
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden="true" />
        <p>
          These details{' '}
          <span className="font-semibold text-neutral-800">
            can&apos;t be changed after the project is saved.
          </span>{' '}
          You can save a draft and come back any time before that.
        </p>
      </div>

      <Card
        className="rounded-xl border-neutral-200 p-5 shadow-none"
        data-testid="profile-card"
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <FormField htmlFor="projectId" label="Project ID">
            <Input
              id="projectId"
              disabled
              placeholder="CMN-[auto]"
              className="h-9 bg-neutral-50 shadow-none disabled:cursor-not-allowed disabled:opacity-70"
            />
          </FormField>
          <FormField
            htmlFor="name"
            label="Project title"
            required
            error={errors.name?.message}
          >
            <Input id="name" className={inputClass(Boolean(errors.name))} {...register('name')} />
          </FormField>
          <FormField
            htmlFor="location"
            label="Location"
            required
            error={errors.location?.message}
            className="md:col-span-2"
          >
            <Input
              id="location"
              className={inputClass(Boolean(errors.location))}
              {...register('location')}
            />
          </FormField>
          <FormField htmlFor="climateZone" label="Climate zone" error={errors.climateZone?.message}>
            <Select
              id="climateZone"
              className="h-9 shadow-none"
              {...register('climateZone')}
            >
              <option value="">Select climate zone</option>
              {CLIMATE_ZONES.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            htmlFor="typologyId"
            label="Typology"
            required
            error={errors.typologyId?.message}
          >
            <Select
              id="typologyId"
              className={inputClass(Boolean(errors.typologyId))}
              {...register('typologyId')}
            >
              <option value="">Select typology</option>
              {typologies.map((typology) => (
                <option key={typology.id} value={typology.id}>
                  {typology.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Card>

      <Card className="rounded-xl border-neutral-200 p-5 shadow-none" data-testid="site-card">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-neutral-900">Site and Building Details</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Used by calculators and credit thresholds.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <FormField htmlFor="plotArea" label="Plot area" required error={errors.plotArea?.message}>
            <AreaInput
              id="plotArea"
              unitId="plotAreaUnit"
              valueName="plotArea"
              unitName="plotAreaUnit"
              register={register}
              error={Boolean(errors.plotArea)}
            />
          </FormField>
          <FormField
            htmlFor="certificationBoundaryArea"
            label="Certification boundary area (if different)"
            error={errors.certificationBoundaryArea?.message}
          >
            <AreaInput
              id="certificationBoundaryArea"
              unitId="certificationBoundaryAreaUnit"
              valueName="certificationBoundaryArea"
              unitName="certificationBoundaryAreaUnit"
              register={register}
              error={Boolean(errors.certificationBoundaryArea)}
            />
          </FormField>
          <FormField
            htmlFor="totalBuiltUpArea"
            label="Total built-up area"
            required
            error={errors.totalBuiltUpArea?.message}
          >
            <AreaInput
              id="totalBuiltUpArea"
              unitId="totalBuiltUpAreaUnit"
              valueName="totalBuiltUpArea"
              unitName="totalBuiltUpAreaUnit"
              register={register}
              error={Boolean(errors.totalBuiltUpArea)}
            />
          </FormField>
          <FormField htmlFor="approvedFar" label="Approved FAR" error={errors.approvedFar?.message}>
            <Input
              id="approvedFar"
              inputMode="decimal"
              className={inputClass(Boolean(errors.approvedFar))}
              {...register('approvedFar')}
            />
          </FormField>
          <FormField
            htmlFor="floorsAboveGround"
            label="No. of floors above ground"
            error={errors.floorsAboveGround?.message}
          >
            <Input
              id="floorsAboveGround"
              inputMode="numeric"
              className={inputClass(Boolean(errors.floorsAboveGround))}
              {...register('floorsAboveGround')}
            />
          </FormField>
          <FormField htmlFor="basements" label="No. of basements" error={errors.basements?.message}>
            <Input
              id="basements"
              inputMode="numeric"
              className={inputClass(Boolean(errors.basements))}
              {...register('basements')}
            />
          </FormField>
        </div>
      </Card>
    </div>
  )
}
