import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Select } from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import { FormField } from '@/features/projects/components/FormField'
import { CertificationStageCards } from '@/features/projects/components/CertificationStageCards'
import {
  useGetCertificationQuery,
  useListCertificationsQuery,
} from '@/features/projects/api/projectsApi'
import {
  certificationDisplayName,
  resolveCertifications,
} from '@/features/projects/lib/certificationCatalog'
import type { ProjectCertificationFormValues } from '@/features/projects/schemas/projectCertification'
import type { CatalogOption, Certification } from '@/features/projects/types'

type CertificationDetailsFormProps = {
  form: UseFormReturn<ProjectCertificationFormValues>
  onBack: () => void
}

function optionsOf(
  cert: Certification | undefined,
  key: 'versions' | 'categories' | 'typologies' | 'ratings',
): CatalogOption[] {
  return cert?.[key] ?? []
}

export function CertificationDetailsForm({ form, onBack }: CertificationDetailsFormProps) {
  const { data: catalog } = useListCertificationsQuery()
  const certifications = useMemo(() => resolveCertifications(catalog), [catalog])
  const certificationId = form.watch('certificationId')
  const selectedFromList = certifications.find((item) => item.id === certificationId)
  const needsDetail = Boolean(
    certificationId && selectedFromList && (selectedFromList.versions?.length ?? 0) === 0,
  )
  const { data: certDetail } = useGetCertificationQuery(certificationId, { skip: !needsDetail })

  const selectedCert = useMemo(() => {
    if (!selectedFromList) return undefined
    if (!certDetail) return selectedFromList
    return resolveCertifications([certDetail])[0] ?? selectedFromList
  }, [selectedFromList, certDetail])

  const certName = certificationDisplayName(selectedCert)
  const previousCertId = useRef(certificationId)

  useEffect(() => {
    if (previousCertId.current === certificationId) return
    previousCertId.current = certificationId
    form.setValue('versionId', '')
    form.setValue('categoryId', '')
    form.setValue('typologyId', '')
    form.setValue('targetRatingId', '')
  }, [certificationId, form])

  const {
    register,
    formState: { errors },
  } = form
  const selectClass = (invalid?: boolean) =>
    cn('wizard-select h-9 shadow-none', invalid && 'border-destructive focus-visible:ring-destructive')

  return (
    <div className="space-y-5" data-testid="certification-form">
      <Card className="rounded-xl border-neutral-200 p-5 shadow-none" data-testid="cert-info-card">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Certification information</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <FormField
            htmlFor="certificationId"
            label="Certification"
            required
            error={errors.certificationId?.message}
          >
            <Select
              id="certificationId"
              className={selectClass(Boolean(errors.certificationId))}
              {...register('certificationId')}
            >
              <option value="">Select certification</option>
              {certifications.map((cert) => (
                <option key={cert.id} value={cert.id}>
                  {cert.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField htmlFor="versionId" label="Version" required error={errors.versionId?.message}>
            <Select
              id="versionId"
              className={selectClass(Boolean(errors.versionId))}
              {...register('versionId')}
            >
              <option value="">Select version</option>
              {optionsOf(selectedCert, 'versions').map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField htmlFor="categoryId" label="Category" error={errors.categoryId?.message}>
            <Select id="categoryId" className="wizard-select h-9 shadow-none" {...register('categoryId')}>
              <option value="">Select category</option>
              {optionsOf(selectedCert, 'categories').map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField htmlFor="certificationTypologyId" label="Typology" error={errors.typologyId?.message}>
            <Select
              id="certificationTypologyId"
              className="wizard-select h-9 shadow-none"
              {...register('typologyId')}
            >
              <option value="">Select typology</option>
              {optionsOf(selectedCert, 'typologies').map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            htmlFor="targetRatingId"
            label="Target rating"
            required
            error={errors.targetRatingId?.message}
            className="md:col-span-2"
          >
            <Select
              id="targetRatingId"
              className={selectClass(Boolean(errors.targetRatingId))}
              {...register('targetRatingId')}
            >
              <option value="">Select target rating</option>
              {optionsOf(selectedCert, 'ratings').map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Card>

      <Card className="rounded-xl border-neutral-200 p-5 shadow-none" data-testid="cert-stage-card">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Certification stage</h2>
        <CertificationStageCards
          value={form.watch('stage')}
          onChange={(stage) => form.setValue('stage', stage, { shouldDirty: true })}
        />
      </Card>

      <div
        className="flex flex-col gap-3 rounded-xl border border-neutral-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
        data-testid="eligibility-callout"
      >
        <div className="max-w-[28rem]">
          <h2 className="text-sm font-semibold text-neutral-900">Assess Certification Eligibility</h2>
          <p className="mt-1 text-[13px] leading-snug text-neutral-500">
            Answer a short questionnaire and get a report on the rating you can realistically achieve
            before committing to credits. Your answers pre-fill the scorecard.
          </p>
        </div>
        <Link
          to={`/projects/new/eligibility?cert=${encodeURIComponent(selectedCert?.id || 'griha')}`}
          className="shrink-0 text-[13px] font-medium text-neutral-900 hover:underline"
          data-testid="check-eligibility"
        >
          Check {certName} Eligibility →
        </Link>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
        <Button
          type="button"
          variant="outline"
          className="h-9 border-neutral-200 bg-white text-[13px] font-medium text-neutral-800 shadow-none"
          onClick={onBack}
          data-testid="certification-back"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          className="h-9 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-800"
          data-testid="next-scorecard"
        >
          Continue to {certName} Scorecard
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
