import type { UseFormRegister } from 'react-hook-form'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import { AREA_UNITS } from '@/features/projects/constants'
import type { ProjectProfileFormValues } from '@/features/projects/schemas/projectProfile'

type AreaInputProps = {
  id: string
  unitId: string
  valueName: keyof ProjectProfileFormValues
  unitName: 'plotAreaUnit' | 'certificationBoundaryAreaUnit' | 'totalBuiltUpAreaUnit'
  register: UseFormRegister<ProjectProfileFormValues>
  error?: boolean
}

export function AreaInput({ id, unitId, valueName, unitName, register, error }: AreaInputProps) {
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        inputMode="decimal"
        className={cn(
          'h-9 flex-1 shadow-none',
          error && 'border-destructive focus-visible:ring-destructive',
        )}
        {...register(valueName)}
      />
      <Select
        id={unitId}
        aria-label={`${id} unit`}
        className="wizard-select h-9 w-[5.75rem] shrink-0 px-2 shadow-none"
        {...register(unitName)}
      >
        {AREA_UNITS.map((unit) => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
