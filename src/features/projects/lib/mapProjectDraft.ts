import type { Project } from '@/features/projects/types'
import type { ProjectProfileFormValues } from '@/features/projects/schemas/projectProfile'
import type { ProjectCertificationFormValues } from '@/features/projects/schemas/projectCertification'
import {
  emptyProjectTimeline,
  type ProjectTimelineFormValues,
} from '@/features/projects/schemas/projectTimeline'
import { mapProjectProfileToApi } from '@/features/projects/lib/mapProjectProfile'
import { mapProjectTimelineToApi } from '@/features/projects/lib/mapProjectTimeline'

export function mapProjectCertificationToApi(
  values: ProjectCertificationFormValues,
): Partial<Project> {
  return {
    certificationId: values.certificationId.trim() || undefined,
    certificationVersionId: values.versionId.trim() || undefined,
    certificationCategoryId: values.categoryId.trim() || undefined,
    typologyId: values.typologyId.trim() || undefined,
    targetRating: values.targetRatingId.trim() || undefined,
    certificationStage: values.stage,
  }
}

export function mapWizardDraftToApi(
  profile: ProjectProfileFormValues,
  certification: ProjectCertificationFormValues,
  timeline: ProjectTimelineFormValues = emptyProjectTimeline,
): Partial<Project> {
  const fromProfile = mapProjectProfileToApi(profile)
  const fromCertification = mapProjectCertificationToApi(certification)
  const fromTimeline = mapProjectTimelineToApi(timeline)
  return {
    ...fromProfile,
    ...fromCertification,
    ...fromTimeline,
    typologyId: fromCertification.typologyId ?? fromProfile.typologyId,
  }
}
