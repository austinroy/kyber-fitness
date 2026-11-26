import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { DatePickerProps, DatePickerTab, ParsedDateParts } from './DatePicker.types'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function parseDateString(dateStr: string): ParsedDateParts | null {
  if (!dateStr) return null
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // 0-indexed
  const day = parseInt(parts[2], 10)
  return { year, month, day }
}

function formatDateString(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function formatDateDisplay(dateStr: string) {
  const parsed = parseDateString(dateStr)
  if (!parsed) return ''
  return `${SHORT_MONTHS[parsed.month]} ${parsed.day}, ${parsed.year}`
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select Date',
  disabled = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Selection states
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate())

  const [activeTab, setActiveTab] = useState<DatePickerTab>('date')

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  // Listen to screen width changes to adapt viewports dynamically
  useEffect(() => {
    setIsMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate and update fixed popover position relative to trigger button
  useEffect(() => {
    if (!isOpen || isMobile) return

    const updatePosition = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const popoverWidth = 320
      const popoverHeight = 370

      let left = rect.left
      if (left + popoverWidth > window.innerWidth - 16) {
        left = Math.max(16, rect.right - popoverWidth)
      }
      if (left < 16) {
        left = 16
      }

      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      let top: number

      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        top = Math.max(16, rect.top - popoverHeight - 8)
      } else {
        top = rect.bottom + 8
      }

      setDropdownStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 9999,
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, isMobile])

  // Sync state when dialog opens
  useEffect(() => {
    if (isOpen) {
      const parsed = parseDateString(value)
      if (parsed) {
        setSelectedYear(parsed.year)
        setSelectedMonth(parsed.month)
        setSelectedDay(parsed.day)
      } else {
        const now = new Date()
        setSelectedYear(now.getFullYear())
        setSelectedMonth(now.getMonth())
        setSelectedDay(now.getDate())
      }
      setActiveTab('date')
    }
  }, [isOpen, value])

  // Click outside and escape key listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      if (!isMobile) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isMobile])

  // Prevent background scrolling on mobile when sheet is active
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, isMobile])

  if (!isMounted) {
    // Return a safe placeholder matching the trigger state during SSR phases
    return (
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          className={`w-full flex items-center justify-between px-4 py-2 bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]/60 border border-[var(--line)] rounded-xl cursor-not-allowed ${className}`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--on-surface-variant)] opacity-50 text-lg">
              calendar_today
            </span>
            <span>{value ? formatDateDisplay(value) : placeholder}</span>
          </span>
          <span className="material-symbols-outlined text-[var(--on-surface-variant)] opacity-50 text-lg">
            expand_more
          </span>
        </button>
      </div>
    )
  }

  const handleSelectMonth = (idx: number) => {
    setSelectedMonth(idx)
    const maxDays = new Date(selectedYear, idx + 1, 0).getDate()
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays)
    }
    setActiveTab('date')
  }

  const handleSelectYear = (year: number) => {
    setSelectedYear(year)
    const maxDays = new Date(year, selectedMonth + 1, 0).getDate()
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays)
    }
    setActiveTab('month')
  }

  const handleApply = () => {
    onChange(formatDateString(selectedYear, selectedMonth, selectedDay))
    setIsOpen(false)
  }

  const handleReset = () => {
    const parsed = parseDateString(value)
    if (parsed) {
      setSelectedYear(parsed.year)
      setSelectedMonth(parsed.month)
      setSelectedDay(parsed.day)
    } else {
      const now = new Date()
      setSelectedYear(now.getFullYear())
      setSelectedMonth(now.getMonth())
      setSelectedDay(now.getDate())
    }
  }

  // Year choices (last 100 years to next 10 years)
  const todayYear = new Date().getFullYear()
  const yearsRange: number[] = []
  for (let y = todayYear + 5; y >= todayYear - 90; y--) {
    yearsRange.push(y)
  }

  // Days in month calculation
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className={`relative w-full ${isOpen ? 'z-30' : ''}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-[var(--surface-container-low)] text-[var(--on-surface)] border border-[var(--line)] rounded-xl hover:border-[var(--primary-container)]/50 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--primary-container)] text-lg select-none">
            calendar_today
          </span>
          <span
            className={
              value ? 'text-[var(--on-surface)] font-medium' : 'text-[var(--on-surface-variant)]/60'
            }
          >
            {value ? formatDateDisplay(value) : placeholder}
          </span>
        </span>
        <span className="material-symbols-outlined text-[var(--on-surface-variant)] text-lg select-none">
          expand_more
        </span>
      </button>

      {/* Desktop Calendar Dropdown */}
      {isOpen &&
        !isMobile &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-[var(--surface-container)] backdrop-blur-md border border-[var(--line)] rounded-xl shadow-2xl p-4 transition-all duration-200"
          >
            {/* Summary Display */}
            <div className="text-center py-2 bg-[var(--surface-container-low)] rounded-xl border border-[var(--line)] mb-3 flex justify-center items-center gap-1.5 font-bold text-[var(--on-surface)] text-sm tracking-wide">
              <span className="text-[var(--primary-container)]">{SHORT_MONTHS[selectedMonth]}</span>
              <span className="text-[var(--secondary-container)]">{selectedDay}</span>
              <span className="text-[var(--on-surface-variant)]">,</span>
              <span className="text-[var(--primary-container)]">{selectedYear}</span>
            </div>

            {/* Tab Selector Bar */}
            <div className="flex bg-[var(--surface-container-lowest)] p-1 rounded-xl border border-[var(--line)] mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('month')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'month'
                    ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                    : 'text-[var(--on-surface)] hover:bg-[var(--link-bg-hover)]'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('date')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'date'
                    ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                    : 'text-[var(--on-surface)] hover:bg-[var(--link-bg-hover)]'
                }`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('year')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'year'
                    ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                    : 'text-[var(--on-surface)] hover:bg-[var(--link-bg-hover)]'
                }`}
              >
                Year
              </button>
            </div>

            {/* Month Screen */}
            {activeTab === 'month' && (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {SHORT_MONTHS.map((m, idx) => {
                  const isSelected = selectedMonth === idx
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={`py-2 text-xs rounded-lg font-semibold transition-all ${
                        isSelected
                          ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                          : 'text-[var(--on-surface)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)]'
                      }`}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Date Screen (No days header label) */}
            {activeTab === 'date' && (
              <div className="grid grid-cols-7 gap-1 py-1">
                {daysArray.map((d) => {
                  const isSelected = selectedDay === d
                  const today = new Date()
                  const isToday =
                    today.getDate() === d &&
                    today.getMonth() === selectedMonth &&
                    today.getFullYear() === selectedYear
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className={`py-1.5 text-xs rounded-lg font-semibold transition-all ${
                        isSelected
                          ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                          : isToday
                            ? 'border border-[var(--primary-container)] text-[var(--primary-container)] bg-[var(--primary-container)]/10'
                            : 'text-[var(--on-surface)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)]'
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Year Screen */}
            {activeTab === 'year' && (
              <div className="grid grid-cols-4 gap-1 py-1 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
                {yearsRange.map((y) => {
                  const isSelected = selectedYear === y
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      className={`py-1.5 text-xs rounded-lg font-semibold transition-all ${
                        isSelected
                          ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                          : 'text-[var(--on-surface)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)]'
                      }`}
                    >
                      {y}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Action Footer */}
            <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors"
              >
                Reset
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold px-3 py-1.5 border border-[var(--line)] hover:bg-[var(--link-bg-hover)] rounded-lg text-[var(--on-surface)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="text-xs px-3 py-1.5 bg-[var(--primary-container)] text-[var(--on-primary-container)] rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Mobile Modal Backdrop & Bottom Sheet */}
      {isOpen &&
        isMobile &&
        createPortal(
          <>
            {/* Backdrop Blur Overlay */}
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[color-mix(in_srgb,var(--background)_78%,transparent)] backdrop-blur-sm z-[9998] transition-opacity duration-300 opacity-100"
            />

            {/* Slide-Up Bottom Sheet */}
            <div className="fixed bottom-0 left-0 w-full z-[9999] bg-[var(--surface-container)] rounded-t-[32px] overflow-hidden flex flex-col border-t border-[var(--line)] max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex justify-between items-center w-full px-6 h-16 border-b border-[var(--line)] bg-[var(--surface-container-lowest)]">
                <button
                  type="button"
                  className="p-2 active:scale-95 transition-transform"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="material-symbols-outlined text-[var(--on-surface)]">close</span>
                </button>
                <h2 className="text-lg font-bold text-[var(--on-surface)]">Select Date</h2>
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--primary-container)] px-4 py-2 hover:bg-[var(--link-bg-hover)] rounded-lg active:scale-95 transition-transform"
                  onClick={handleApply}
                >
                  Done
                </button>
              </div>

              {/* Datepicker Content */}
              <div className="overflow-y-auto p-6 space-y-4">
                {/* Summary Display */}
                <div className="text-center py-2.5 bg-[var(--surface-container-low)] rounded-xl border border-[var(--line)] flex justify-center items-center gap-1.5 font-bold text-[var(--on-surface)] text-md tracking-wide">
                  <span className="text-[var(--primary-container)]">{MONTHS[selectedMonth]}</span>
                  <span className="text-[var(--secondary-container)]">{selectedDay}</span>
                  <span className="text-[var(--on-surface-variant)]">,</span>
                  <span className="text-[var(--primary-container)]">{selectedYear}</span>
                </div>

                {/* Tab Selector Bar */}
                <div className="flex bg-[var(--surface-container-lowest)] p-1 rounded-xl border border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('month')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'month'
                        ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                        : 'text-[var(--on-surface)] hover:bg-[var(--link-bg-hover)]'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('date')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'date'
                        ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                        : 'text-[var(--on-surface)] hover:bg-[var(--link-bg-hover)]'
                    }`}
                  >
                    Date
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('year')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      activeTab === 'year'
                        ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                        : 'text-[var(--on-surface)] hover:bg-[var(--link-bg-hover)]'
                    }`}
                  >
                    Year
                  </button>
                </div>

                {/* Month Screen */}
                {activeTab === 'month' && (
                  <div className="grid grid-cols-3 gap-2.5 py-2">
                    {SHORT_MONTHS.map((m, idx) => {
                      const isSelected = selectedMonth === idx
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleSelectMonth(idx)}
                          className={`py-3 text-sm rounded-xl font-semibold transition-all ${
                            isSelected
                              ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                              : 'text-[var(--on-surface)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] active:scale-95'
                          }`}
                        >
                          {MONTHS[idx]}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Date Screen (No days header label) */}
                {activeTab === 'date' && (
                  <div className="grid grid-cols-7 gap-1.5 py-2">
                    {daysArray.map((d) => {
                      const isSelected = selectedDay === d
                      const today = new Date()
                      const isToday =
                        today.getDate() === d &&
                        today.getMonth() === selectedMonth &&
                        today.getFullYear() === selectedYear
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSelectedDay(d)}
                          className={`h-11 flex items-center justify-center text-sm rounded-xl font-semibold transition-all ${
                            isSelected
                              ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)] active:scale-95'
                              : isToday
                                ? 'border border-[var(--primary-container)] text-[var(--primary-container)] bg-[var(--primary-container)]/10'
                                : 'text-[var(--on-surface)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)]'
                          }`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Year Screen */}
                {activeTab === 'year' && (
                  <div className="grid grid-cols-4 gap-2 py-2 overflow-y-auto max-h-[30vh] pr-1 custom-scrollbar">
                    {yearsRange.map((y) => {
                      const isSelected = selectedYear === y
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => handleSelectYear(y)}
                          className={`py-3 text-sm rounded-xl font-semibold transition-all ${
                            isSelected
                              ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                              : 'text-[var(--on-surface)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] active:scale-95'
                          }`}
                        >
                          {y}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Commit Action Button */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-3 bg-[var(--surface-container-low)] text-[var(--on-surface)] font-semibold rounded-xl border border-[var(--line)] active:scale-95 transition-transform"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 py-3 bg-[var(--primary-container)] text-[var(--on-primary-container)] font-bold rounded-xl shadow-[0_0_20px_rgba(195,244,0,0.3)] hover:opacity-90 active:scale-95 transition-transform"
                  >
                    Apply
                  </button>
                </div>
              </div>
              {/* Bottom safe area padding */}
              <div className="h-8 bg-[var(--surface-container)]" />
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
