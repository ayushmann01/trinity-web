import type { CatalogOption, Certification } from '@/features/projects/types'

const option = (id: string, name: string): CatalogOption => ({ id, name })

export const DEFAULT_CERT_DISPLAY_NAME = 'GRIHA'

export const DEFAULT_CERTIFICATIONS: Certification[] = [
  {
    id: 'griha',
    name: 'GRIHA',
    shortName: 'GRIHA',
    typologies: [
      option('new-construction', 'New Construction'),
      option('existing-building', 'Existing Building'),
      option('large-development', 'Large Development'),
      option('affordable-housing', 'Affordable Housing'),
    ],
    versions: [option('v2019', 'v.2019'), option('v2015', 'v.2015')],
    categories: [
      option('new-buildings', 'New Buildings'),
      option('existing-buildings', 'Existing Buildings'),
      option('cities', 'Cities'),
    ],
    ratings: [
      option('1-star', '1 Star'),
      option('2-star', '2 Star'),
      option('3-star', '3 Star'),
      option('4-star', '4 Star'),
      option('5-star', '5 Star'),
    ],
  },
  {
    id: 'igbc',
    name: 'IGBC',
    shortName: 'IGBC',
    typologies: [
      option('new-construction', 'New Construction'),
      option('core-and-shell', 'Core and Shell'),
      option('interiors', 'Interiors'),
      option('existing-building', 'Existing Building'),
    ],
    versions: [option('v2024', 'v.2024'), option('v2019', 'v.2019')],
    categories: [
      option('new-buildings', 'New Buildings'),
      option('existing-buildings', 'Existing Buildings'),
      option('interiors', 'Interiors'),
    ],
    ratings: [
      option('certified', 'Certified'),
      option('silver', 'Silver'),
      option('gold', 'Gold'),
      option('platinum', 'Platinum'),
    ],
  },
  {
    id: 'leed',
    name: 'LEED',
    shortName: 'LEED',
    typologies: [
      option('new-construction', 'New Construction'),
      option('core-and-shell', 'Core and Shell'),
      option('interiors', 'Interiors'),
      option('existing-building', 'Existing Building'),
    ],
    versions: [option('v4.1', 'v4.1'), option('v4', 'v4')],
    categories: [
      option('bdc', 'BD+C'),
      option('idc', 'ID+C'),
      option('om', 'O+M'),
    ],
    ratings: [
      option('certified', 'Certified'),
      option('silver', 'Silver'),
      option('gold', 'Gold'),
      option('platinum', 'Platinum'),
    ],
  },
]

function fallbackFor(cert: Certification): Certification | undefined {
  const needle = cert.name.trim().toLowerCase()
  return DEFAULT_CERTIFICATIONS.find(
    (item) => item.id === cert.id || item.name.toLowerCase() === needle,
  )
}

function mergeOptions(
  primary: CatalogOption[] | undefined,
  fallback: CatalogOption[] | undefined,
): CatalogOption[] {
  if (primary && primary.length > 0) return primary
  return fallback ?? []
}

export function resolveCertifications(apiData?: Certification[] | null): Certification[] {
  if (!apiData || apiData.length === 0) return DEFAULT_CERTIFICATIONS
  return apiData.map((cert) => {
    const fallback = fallbackFor(cert)
    return {
      ...fallback,
      ...cert,
      shortName: cert.shortName ?? fallback?.shortName ?? cert.name,
      typologies: mergeOptions(cert.typologies, fallback?.typologies),
      versions: mergeOptions(cert.versions, fallback?.versions),
      categories: mergeOptions(cert.categories, fallback?.categories),
      ratings: mergeOptions(cert.ratings, fallback?.ratings),
    }
  })
}

export function certificationDisplayName(cert?: Certification | null): string {
  return cert?.shortName || cert?.name || DEFAULT_CERT_DISPLAY_NAME
}
