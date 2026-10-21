import { z } from 'zod'

export const areaUnitSchema = z.enum(['sq_m', 'sq_ft'])

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`)

const requiredPositiveNumber = (label: string) =>
  z.string().trim().superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: 'custom', message: `${label} is required` })
      return
    }
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
      ctx.addIssue({ code: 'custom', message: `${label} must be a positive number` })
    }
  })

const optionalNumber = z.string().refine(
  (value) => {
    const trimmed = value.trim()
    return trimmed === '' || Number.isFinite(Number(trimmed))
  },
  { message: 'Must be a number' },
)

export const projectProfileSchema = z.object({
  name: requiredText('Project title'),
  location: requiredText('Location'),
  climateZone: z.string(),
  typologyId: requiredText('Typology'),
  plotArea: requiredPositiveNumber('Plot area'),
  plotAreaUnit: areaUnitSchema,
  certificationBoundaryArea: optionalNumber,
  certificationBoundaryAreaUnit: areaUnitSchema,
  totalBuiltUpArea: requiredPositiveNumber('Total built-up area'),
  totalBuiltUpAreaUnit: areaUnitSchema,
  approvedFar: optionalNumber,
  floorsAboveGround: optionalNumber,
  basements: optionalNumber,
})

export type ProjectProfileFormValues = z.infer<typeof projectProfileSchema>

export const emptyProjectProfile: ProjectProfileFormValues = {
  name: '',
  location: '',
  climateZone: '',
  typologyId: '',
  plotArea: '',
  plotAreaUnit: 'sq_m',
  certificationBoundaryArea: '',
  certificationBoundaryAreaUnit: 'sq_m',
  totalBuiltUpArea: '',
  totalBuiltUpAreaUnit: 'sq_m',
  approvedFar: '',
  floorsAboveGround: '',
  basements: '',
}
