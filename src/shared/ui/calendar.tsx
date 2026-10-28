import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import type { DayPickerProps } from 'react-day-picker'
import { cn } from '@/shared/lib/utils'
import 'react-day-picker/style.css'

export type CalendarProps = DayPickerProps

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-2', className)}
      classNames={{
        ...defaults,
        root: cn(defaults.root, 'p-2'),
        selected: cn(defaults.selected, 'bg-neutral-900 text-white'),
        today: cn(defaults.today, 'font-semibold text-neutral-900'),
        chevron: cn(defaults.chevron, 'fill-neutral-700'),
        ...classNames,
      }}
      {...props}
    />
  )
}
