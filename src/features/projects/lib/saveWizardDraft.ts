import type { Project } from '@/features/projects/types'
import type { DraftApiPayload } from '@/features/projects/lib/mapProjectDraftApi'

export async function persistDraftOnServer(args: {
  projectId?: string
  payload: DraftApiPayload
  create: (body: DraftApiPayload) => Promise<Project>
  update: (id: string, body: DraftApiPayload) => Promise<Project>
  saveCriteria?: (projectId: string, attemptedIds: number[], maybeIds: number[]) => Promise<unknown>
  scorecard?: { attemptedIds: number[]; maybeIds: number[] }
}): Promise<{ project: Project; created: boolean }> {
  const projectId = args.projectId?.trim()
  const created = !projectId
  const project = created
    ? await args.create({ ...args.payload, state: args.payload.state ?? 'DRAFT' })
    : await args.update(projectId, args.payload)

  const hasCertification = args.payload.certification_data_id != null || project.certificationDataId != null
  if (hasCertification && args.saveCriteria && args.scorecard) {
    try {
      await args.saveCriteria(project.id, args.scorecard.attemptedIds, args.scorecard.maybeIds)
    } catch {
      // Criteria cannot be saved until the draft has a certification snapshot.
    }
  }

  return { project, created }
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const fromData = (error as { data?: { message?: string } } | undefined)?.data?.message
  if (fromData?.trim()) return fromData
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}
