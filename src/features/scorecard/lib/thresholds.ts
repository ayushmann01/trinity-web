import type { ScorecardThreshold } from '@/features/scorecard/types'

export const CERTIFICATION_SCALE = 100

export const DEFAULT_SCORECARD_THRESHOLDS: ScorecardThreshold[] = [
  { id: 'certified', label: 'Certified', points: 25 },
  { id: 'silver', label: 'Silver', points: 50 },
  { id: 'gold', label: 'Gold', points: 75 },
  { id: 'platinum', label: 'Platinum', points: 90 },
]

const GRIHA_RATING_TO_THRESHOLD: Record<string, string> = {
  '1-star': 'certified',
  '1star': 'certified',
  certified: 'certified',
  '2-star': 'silver',
  '2star': 'silver',
  silver: 'silver',
  '3-star': 'silver',
  '3star': 'silver',
  '4-star': 'gold',
  '4star': 'gold',
  gold: 'gold',
  '5-star': 'platinum',
  '5star': 'platinum',
  platinum: 'platinum',
}

export function thresholdsForCertification(certificationId?: string): ScorecardThreshold[] {
  void certificationId
  return DEFAULT_SCORECARD_THRESHOLDS
}

export function activeThresholdId(
  targetRatingId?: string | null,
  certificationTarget?: string | null,
): string | null {
  const raw = (targetRatingId || certificationTarget || '').trim().toLowerCase()
  if (!raw) return null
  const key = raw.replace(/[\s_]+/g, '-')
  if (GRIHA_RATING_TO_THRESHOLD[key]) return GRIHA_RATING_TO_THRESHOLD[key]
  const compact = key.replace(/-/g, '')
  return GRIHA_RATING_TO_THRESHOLD[compact] ?? null
}

export function targetPointsForRating(
  targetRatingId?: string | null,
  fallbackMin?: number | null,
): number | null {
  const thresholdId = activeThresholdId(targetRatingId)
  const match = DEFAULT_SCORECARD_THRESHOLDS.find((item) => item.id === thresholdId)
  if (match) return match.points
  return fallbackMin ?? null
}
