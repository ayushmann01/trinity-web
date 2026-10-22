import { describe, expect, it } from 'vitest'
import { mapWizardDraftToApi } from '@/features/projects/lib/mapProjectDraft'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'

describe('mapWizardDraftToApi', () => {
  it('maps certification fields onto the project API shape', () => {
    const payload = mapWizardDraftToApi(
      { ...emptyProjectProfile, name: 'Harbor', location: 'Pune', typologyId: 'residential' },
      {
        ...emptyProjectCertification,
        certificationId: 'griha',
        versionId: 'v2019',
        categoryId: 'new-buildings',
        typologyId: 'new-construction',
        targetRatingId: '5-star',
        stage: 'pre-certification',
      },
    )

    expect(payload).toMatchObject({
      name: 'Harbor',
      location: 'Pune',
      certificationId: 'griha',
      certificationVersionId: 'v2019',
      certificationCategoryId: 'new-buildings',
      typologyId: 'new-construction',
      targetRating: '5-star',
      certificationStage: 'pre-certification',
    })
  })
})
