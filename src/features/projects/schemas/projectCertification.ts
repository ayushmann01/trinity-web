import { z } from 'zod'

export const projectCertificationSchema = z.object({
  certificationId: z.string().trim().min(1, 'Certification is required'),
  versionId: z.string().trim().min(1, 'Version is required'),
  categoryId: z.string(),
  typologyId: z.string(),
  targetRatingId: z.string().trim().min(1, 'Target rating is required'),
  stage: z.enum(['pre-certification', 'certification']),
})

export type ProjectCertificationFormValues = z.infer<typeof projectCertificationSchema>

export const emptyProjectCertification: ProjectCertificationFormValues = {
  certificationId: '',
  versionId: '',
  categoryId: '',
  typologyId: '',
  targetRatingId: '',
  stage: 'pre-certification',
}
