import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'

type ZodLikeSchema = {
  safeParse: (data: unknown) => {
    success: boolean
    data?: FieldValues
    error?: { issues: { path: PropertyKey[]; code: string; message: string }[] }
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
      const key = issue.path[0]
      if (typeof key !== 'string' || key in errors) continue
      Object.assign(errors, {
        [key]: { type: issue.code, message: issue.message },
      })
    }

    return { values: {}, errors }
  }
}
