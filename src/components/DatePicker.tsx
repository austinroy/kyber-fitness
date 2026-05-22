import { useState, useEffect, useRef } from 'react'

interface DatePickerProps {
  value: string // Format: YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function parseDateString(dateStr: string) {
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
  className = ''
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Calendar navigation state
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())

  // Selection states
  const [tempDate, setTempDate] = useState<string | null>(null)
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Listen to screen width changes to adapt viewports dynamically
  useEffect(() => {
    setIsMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sync tempDate state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTempDate(value || null)
      const parsed = parseDateString(value)
      if (parsed) {
        setCurrentYear(parsed.year)
        setCurrentMonth(parsed.month)
      } else {
        const now = new Date()
        setCurrentYear(now.getFullYear())
        setCurrentMonth(now.getMonth())
      }
      setShowMonthYearPicker(false)
    }
  }, [isOpen, value])

  // Click outside listener for desktop popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
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
          className={`w-full flex items-center justify-between px-4 py-2 bg-[#201f1f] text-white/40 border border-white/10 rounded-xl cursor-not-allowed ${className}`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#c4c9ac] opacity-50 text-lg">calendar_today</span>
            <span>{value ? formatDateDisplay(value) : placeholder}</span>
          </span>
          <span className="material-symbols-outlined text-[#c4c9ac] opacity-50 text-lg">expand_more</span>
        </button>
      </div>
    )
  }

  // Calendar Math
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  const calendarDays: Array<{ day: number; isCurrentMonth: boolean; dateString: string }> = []

  // Prev Month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    calendarDays.push({
      day,
      isCurrentMonth: false,
      dateString: formatDateString(prevYear, prevMonthIdx, day)
    })
  }

  // Current Month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      dateString: formatDateString(currentYear, currentMonth, i)
    })
  }

  // Next Month leading days to fill grid cells (pad to multiples of 7)
  const remainingCells = 42 - calendarDays.length
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      dateString: formatDateString(nextYear, nextMonthIdx, i)
    })
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleSelectDay = (dateString: string) => {
    setTempDate(dateString)
  }

  const handleApply = () => {
    if (tempDate) {
      onChange(tempDate)
    }
    setIsOpen(false)
  }

  const handleReset = () => {
    setTempDate(value || null)
    const parsed = parseDateString(value)
    if (parsed) {
      setCurrentYear(parsed.year)
      setCurrentMonth(parsed.month)
    }
  }

  // Year choices (last 100 years to next 10 years)
  const todayYear = new Date().getFullYear()
  const yearsRange: number[] = []
  for (let y = todayYear + 5; y >= todayYear - 90; y--) {
    yearsRange.push(y)
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-[#201f1f] text-on-surface border border-white/10 rounded-xl hover:border-[#c3f400]/50 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#abd600] text-lg select-none">calendar_today</span>
          <span className={value ? 'text-white font-medium' : 'text-white/40'}>
            {value ? formatDateDisplay(value) : placeholder}
          </span>
        </span>
        <span className="material-symbols-outlined text-[#c4c9ac] text-lg select-none">expand_more</span>
      </button>

      {/* Desktop Calendar Dropdown */}
      {isOpen && !isMobile && (
        <div className="absolute left-0 md:right-0 mt-2 w-[340px] bg-[#1e1e1ec0] backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-[60] p-4 transition-all duration-200">
          {/* Enhanced Month & Year Selection Layer */}
          {showMonthYearPicker ? (
            <div className="flex flex-col h-[280px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Select Month & Year</span>
                <button
                  type="button"
                  onClick={() => setShowMonthYearPicker(false)}
                  className="material-symbols-outlined p-1 text-[#c4c9ac] hover:text-[#c3f400] transition-colors"
                >
                  close
                </button>
              </div>

              {/* Month Selection Grid */}
              <div className="grid grid-cols-3 gap-1 mb-3">
                {SHORT_MONTHS.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(idx)
                    }}
                    className={`py-1 text-xs rounded-lg transition-colors font-medium ${
                      currentMonth === idx
                        ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                        : 'text-[#e5e2e1] hover:bg-white/5'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="h-px bg-white/10 mb-3" />

              {/* Scrollable Year Selection Grid */}
              <div className="grid grid-cols-4 gap-1 overflow-y-auto max-h-24 pr-1 custom-scrollbar">
                {yearsRange.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setCurrentYear(y)
                    }}
                    className={`py-1 text-xs rounded-lg transition-colors ${
                      currentYear === y
                        ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                        : 'text-[#e5e2e1] hover:bg-white/5'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowMonthYearPicker(false)}
                className="mt-auto w-full py-1.5 border border-[#c3f400]/40 text-[#c3f400] text-xs font-semibold rounded-lg hover:bg-[#c3f400]/10 transition-colors"
              >
                Back to Calendar
              </button>
            </div>
          ) : (
            /* Standard Grid Calendar */
            <div>
              {/* Header Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="material-symbols-outlined p-1 text-[#c4c9ac] hover:text-[#c3f400] hover:bg-white/5 rounded-full transition-all"
                >
                  chevron_left
                </button>
                <button
                  type="button"
                  onClick={() => setShowMonthYearPicker(true)}
                  className="flex items-center gap-1 px-3 py-1 hover:bg-white/5 rounded-full transition-all group"
                >
                  <span className="text-xs font-bold text-[#e5e2e1] uppercase tracking-widest">
                    {MONTHS[currentMonth]} {currentYear}
                  </span>
                  <span className="material-symbols-outlined text-[#c4c9ac] group-hover:text-[#c3f400] text-sm transition-colors">
                    expand_more
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="material-symbols-outlined p-1 text-[#c4c9ac] hover:text-[#c3f400] hover:bg-white/5 rounded-full transition-all"
                >
                  chevron_right
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {DAYS_HEADER.map((d) => (
                  <span key={d} className="text-xs font-bold text-[#c4c9ac] opacity-50 uppercase select-none">
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((cell, idx) => {
                  const isSelected = tempDate === cell.dateString
                  const todayStr = formatDateString(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    new Date().getDate()
                  )
                  const isToday = cell.dateString === todayStr

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDay(cell.dateString)}
                      className={`py-1 text-xs rounded-lg transition-all font-medium ${
                        !cell.isCurrentMonth
                          ? 'text-[#c4c9ac]/30 hover:bg-white/5 hover:text-white'
                          : isSelected
                            ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                            : isToday
                              ? 'border border-[#c3f400] text-[#c3f400]'
                              : 'text-[#e5e2e1] hover:bg-white/5'
                      }`}
                    >
                      {cell.day}
                    </button>
                  )
                })}
              </div>

              {/* Action Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-medium text-[#c4c9ac] hover:text-white transition-colors"
                >
                  Reset
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-medium px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded-lg text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="text-xs px-3 py-1.5 bg-[#c3f400] text-[#161e00] rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Modal Backdrop & Bottom Sheet */}
      {isOpen && isMobile && (
        <>
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#131313cc] backdrop-blur-sm z-[9998] transition-opacity duration-300 opacity-100"
          />

          {/* Slide-Up Bottom Sheet */}
          <div className="fixed bottom-0 left-0 w-full z-[9999] bg-[#1e1e1e] rounded-t-[32px] overflow-hidden flex flex-col border-t border-white/10 max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center w-full px-6 h-16 border-b border-white/10 bg-[#131313]">
              <button type="button" className="p-2 active:scale-95 transition-transform" onClick={() => setIsOpen(false)}>
                <span className="material-symbols-outlined text-white">close</span>
              </button>
              <h2 className="text-lg font-bold text-white">Select Date</h2>
              <button
                type="button"
                className="text-sm font-semibold text-[#c3f400] px-4 py-2 hover:bg-white/5 rounded-lg active:scale-95 transition-transform"
                onClick={handleApply}
              >
                Done
              </button>
            </div>

            {/* Datepicker Content */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Header Navigation with Toggler */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-2 text-md font-bold text-white hover:text-[#c3f400] transition-colors"
                  onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
                >
                  {MONTHS[currentMonth]} {currentYear}
                  <span className="material-symbols-outlined text-sm">
                    {showMonthYearPicker ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-white">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-white">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Inset lists for Month & Year Picker */}
              {showMonthYearPicker ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    {/* Months scroll */}
                    <div className="flex-1 h-64 overflow-y-auto space-y-2 border-r border-white/5 pr-2 custom-scrollbar">
                      {SHORT_MONTHS.map((m, idx) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCurrentMonth(idx)}
                          className={`w-full p-3 text-center rounded-xl font-medium transition-all ${
                            currentMonth === idx
                              ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                              : 'text-white hover:bg-white/5'
                          }`}
                        >
                          {MONTHS[idx]}
                        </button>
                      ))}
                    </div>

                    {/* Years scroll */}
                    <div className="flex-1 h-64 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                      {yearsRange.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setCurrentYear(y)}
                          className={`w-full p-3 text-center rounded-xl font-medium transition-all ${
                            currentYear === y
                              ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                              : 'text-white hover:bg-white/5'
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMonthYearPicker(false)}
                    className="w-full py-3 border border-[#c3f400] text-[#c3f400] font-semibold rounded-xl hover:bg-[#c3f400]/10 active:scale-[0.98] transition-all"
                  >
                    Back to Calendar
                  </button>
                </div>
              ) : (
                /* Calendar Grid */
                <div>
                  <div className="grid grid-cols-7 gap-y-2 text-center mb-4">
                    {/* Days Header */}
                    {DAYS_HEADER.map((d) => (
                      <div key={d} className="font-semibold text-xs text-[#c4c9ac] py-2 uppercase select-none">
                        {d}
                      </div>
                    ))}

                    {/* Days Grid */}
                    {calendarDays.map((cell, idx) => {
                      const isSelected = tempDate === cell.dateString
                      const todayStr = formatDateString(
                        new Date().getFullYear(),
                        new Date().getMonth(),
                        new Date().getDate()
                      )
                      const isToday = cell.dateString === todayStr

                      return (
                        <div key={idx} className="p-1">
                          <button
                            type="button"
                            onClick={() => handleSelectDay(cell.dateString)}
                            className={`h-12 w-full flex items-center justify-center rounded-xl font-medium text-sm transition-all ${
                              !cell.isCurrentMonth
                                ? 'text-[#c4c9ac]/30 hover:bg-white/5'
                                : isSelected
                                  ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_12px_rgba(195,244,0,0.4)] active:scale-95'
                                  : isToday
                                    ? 'border border-[#c3f400] text-[#c3f400]'
                                    : 'text-white hover:bg-white/5'
                            }`}
                          >
                            {cell.day}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Commit Action Button */}
                  <button
                    type="button"
                    onClick={handleApply}
                    className="w-full py-4 bg-[#c3f400] text-[#161e00] font-bold rounded-xl shadow-[0_0_20px_rgba(195,244,0,0.3)] hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    Apply Changes
                  </button>
                </div>
              )}
            </div>
            {/* Bottom safe area padding */}
            <div className="h-8 bg-[#1e1e1e]" />
          </div>
        </>
      )}
    </div>
  )
}
