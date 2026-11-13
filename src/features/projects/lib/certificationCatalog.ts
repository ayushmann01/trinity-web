import type { CatalogOption, Certification, CertificationVersionOption } from '@/features/projects/types'

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

type UnknownRecord = Record<string, unknown>

type VersionAccumulator = {
  id: string
  name: string
  categories: Map<string, CatalogOption>
}

type CertificationAccumulator = {
  id: string
  name: string
  versions: Map<string, VersionAccumulator>
  categories: Map<string, CatalogOption>
  typologies: Map<string, CatalogOption>
  ratings: Map<string, CatalogOption>
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function extractRows(raw: unknown): UnknownRecord[] {
  if (Array.isArray(raw)) return raw.filter(isRecord)
  if (isRecord(raw) && Array.isArray(raw.data)) return raw.data.filter(isRecord)
  return []
}

function isActive(state: unknown): boolean {
  if (state == null || state === '') return true
  return firstString(state)?.toUpperCase() === 'ACTIVE'
}

function readTypologies(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => firstString(item))
      .filter((item): item is string => Boolean(item))
  }
  const single = firstString(value)
  return single ? [single] : []
}

function readBenchmarks(value: unknown): UnknownRecord[] {
  if (typeof value === 'string' && value.trim()) {
    try {
      return readBenchmarks(JSON.parse(value) as unknown)
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  return value.filter(isRecord)
}

function typologyKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function mapValues<T, U>(map: Map<string, T>, project: (item: T) => U): U[] {
  return Array.from(map.values()).map(project)
}

/**
 * Groups flat `certification_data` rows from GET /projects/certifications into the
 * nested Certification shape the wizard dropdowns use.
 */
export function groupCertificationRows(raw: unknown): Certification[] {
  const grouped = new Map<string, CertificationAccumulator>()

  for (const row of extractRows(raw)) {
    if (!isActive(row.state)) continue

    const certificationId = firstString(row.certification_id, row.certificationId)
    if (!certificationId) continue

    const certificationName =
      firstString(row.certification_name, row.certificationName) ?? certificationId
    const versionId = firstString(row.version_id, row.versionId)
    const versionName = firstString(row.version_name, row.versionName) ?? versionId
    const categoryId = firstString(row.category_id, row.categoryId)
    const categoryName = firstString(row.category_name, row.categoryName) ?? categoryId
    const certificationDataId = firstNumber(row.id)

    let cert = grouped.get(certificationId)
    if (!cert) {
      cert = {
        id: certificationId,
        name: certificationName,
        versions: new Map(),
        categories: new Map(),
        typologies: new Map(),
        ratings: new Map(),
      }
      grouped.set(certificationId, cert)
    } else if (!cert.name && certificationName) {
      cert.name = certificationName
    }

    let version: VersionAccumulator | undefined
    if (versionId) {
      version = cert.versions.get(versionId)
      if (!version) {
        version = { id: versionId, name: versionName ?? versionId, categories: new Map() }
        cert.versions.set(versionId, version)
      }
    }

    if (categoryId) {
      const category: CatalogOption = {
        id: categoryId,
        name: categoryName ?? categoryId,
        certificationDataId,
      }
      if (!cert.categories.has(categoryId)) cert.categories.set(categoryId, category)
      if (version && !version.categories.has(categoryId)) {
        version.categories.set(categoryId, category)
      }
    }

    for (const typology of readTypologies(row.typology)) {
      const key = typologyKey(typology)
      if (key && !cert.typologies.has(key)) {
        cert.typologies.set(key, { id: typology, name: typology })
      }
    }

    for (const benchmark of readBenchmarks(row.benchmark)) {
      const ratingId = firstString(benchmark.target_id, benchmark.targetId)
      if (!ratingId || cert.ratings.has(ratingId)) continue
      cert.ratings.set(ratingId, {
        id: ratingId,
        name: firstString(benchmark.target_title, benchmark.targetTitle) ?? ratingId,
      })
    }
  }

  return Array.from(grouped.values()).map((cert) => {
    const versions: CertificationVersionOption[] = mapValues(cert.versions, (version) => ({
      id: version.id,
      name: version.name,
      categories: mapValues(version.categories, (category) => category),
    }))

    return {
      id: cert.id,
      name: cert.name,
      shortName: cert.name,
      typologies: mapValues(cert.typologies, (item) => item),
      versions,
      categories: mapValues(cert.categories, (item) => item),
      ratings: mapValues(cert.ratings, (item) => item),
    }
  })
}

export function certificationDataIdFor(
  cert: Certification | undefined,
  versionId?: string,
  categoryId?: string,
): number | undefined {
  if (!cert) return undefined
  if (versionId && categoryId) {
    const nested = cert.versions
      ?.find((version) => version.id === versionId)
      ?.categories?.find((category) => category.id === categoryId)
    if (nested?.certificationDataId != null) return nested.certificationDataId
  }
  if (categoryId) {
    return cert.categories?.find((category) => category.id === categoryId)?.certificationDataId
  }
  return undefined
}

/** Use bundled defaults only when the catalog request failed. Successful payloads are shown as-is. */
export function resolveCertifications(
  apiData?: Certification[] | null,
  isError = false,
): Certification[] {
  if (isError) return DEFAULT_CERTIFICATIONS
  return apiData ?? []
}

export function certificationDisplayName(cert?: Certification | null): string {
  return cert?.shortName || cert?.name || DEFAULT_CERT_DISPLAY_NAME
}

/** Wizard scorecard title: API catalog first, never the bundled DEFAULT_CERTIFICATIONS list. */
export function scorecardCertificationName(
  catalog: Certification[] | undefined,
  certificationId?: string | null,
  fallback?: string | null,
): string {
  const selected = catalog?.find((item) => item.id === certificationId)
  if (selected) return certificationDisplayName(selected)
  const named = fallback?.trim()
  if (named) return named
  const id = certificationId?.trim()
  if (id) return id
  return DEFAULT_CERT_DISPLAY_NAME
}
