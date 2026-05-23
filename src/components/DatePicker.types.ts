export interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export interface ParsedDateParts {
  year: number
  month: number
  day: number
}

export type DatePickerTab = 'month' | 'date' | 'year'
