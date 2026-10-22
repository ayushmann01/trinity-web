import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { cn } from '@/shared/lib/utils'
import { formatDisplayDate, parseIsoDate, toIsoDate } from '@/features/projects/lib/timeline'

type DatePickerProps = {
  id?: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  invalid?: boolean
  testId?: string
  'aria-label'?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = '',
  invalid,
  testId,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseIsoDate(value)
  const display = formatDisplayDate(value)

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          id={id}
          aria-label={ariaLabel}
          data-testid={testId}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 text-left text-[13px] font-normal shadow-none hover:bg-white',
            display ? 'text-neutral-900' : 'text-neutral-400',
            invalid && 'border-destructive focus-visible:ring-destructive',
          )}
        >
          <span className="truncate">{display || placeholder}</span>
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(date ? toIsoDate(date) : '')
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <input
        type="date"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-testid={testId ? `${testId}-value` : undefined}
      />
    </div>
  )
}
