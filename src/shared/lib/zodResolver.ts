import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'

type ZodLikeSchema = {
  safeParse: (data: unknown) => {
    success: boolean
    data?: FieldValues
    error?: { issues: { path: PropertyKey[]; code: string; message: string }[] }
  }
}

function assignIssue(
  errors: FieldErrors<FieldValues>,
  path: PropertyKey[],
  issue: { code: string; message: string },
) {
  if (path.length === 0) return

  let cursor: Record<PropertyKey, unknown> = errors
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index]
    const existing = cursor[segment]
    if (existing == null || typeof existing !== 'object') {
      cursor[segment] = {}
    }
    cursor = cursor[segment] as Record<PropertyKey, unknown>
  }

  const leaf = path[path.length - 1]
  if (cursor[leaf] == null) {
    cursor[leaf] = { type: issue.code, message: issue.message }
  }
}

export function zodResolver<TFieldValues extends FieldValues>(
  schema: ZodLikeSchema,
): Resolver<TFieldValues> {
  return async (values) => {
    const result = schema.safeParse(values)
    if (result.success && result.data) {
      return { values: result.data as TFieldValues, errors: {} }
    }

    const errors: FieldErrors<TFieldValues> = {}
    for (const issue of result.error?.issues ?? []) {
      assignIssue(errors, issue.path, issue)
    }

    return { values: {}, errors }
  }
}
