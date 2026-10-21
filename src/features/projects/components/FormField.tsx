import type { ReactNode } from 'react'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/lib/utils'

type FormFieldProps = {
  htmlFor?: string
  label: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}

export function FormField({ htmlFor, label, required, error, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-neutral-700">
        {label}
        {required ? (
          <span className="text-red-500" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
