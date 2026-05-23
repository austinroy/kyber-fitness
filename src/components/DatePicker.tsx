import { useState, useEffect, useRef } from 'react'
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

  // Listen to screen width changes to adapt viewports dynamically
  useEffect(() => {
    setIsMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
            <span className="material-symbols-outlined text-[#c4c9ac] opacity-50 text-lg">
              calendar_today
            </span>
            <span>{value ? formatDateDisplay(value) : placeholder}</span>
          </span>
          <span className="material-symbols-outlined text-[#c4c9ac] opacity-50 text-lg">
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
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-[#201f1f] text-on-surface border border-white/10 rounded-xl hover:border-[#c3f400]/50 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#abd600] text-lg select-none">
            calendar_today
          </span>
          <span className={value ? 'text-white font-medium' : 'text-white/40'}>
            {value ? formatDateDisplay(value) : placeholder}
          </span>
        </span>
        <span className="material-symbols-outlined text-[#c4c9ac] text-lg select-none">
          expand_more
        </span>
      </button>

      {/* Desktop Calendar Dropdown */}
      {isOpen && !isMobile && (
        <div className="absolute left-0 md:right-0 mt-2 w-[320px] bg-[#1e1e1ec0] backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-[60] p-4 transition-all duration-200">
          {/* Summary Display */}
          <div className="text-center py-2 bg-white/5 rounded-xl border border-white/5 mb-3 flex justify-center items-center gap-1.5 font-bold text-white text-sm tracking-wide">
            <span className="text-[#c3f400]">{SHORT_MONTHS[selectedMonth]}</span>
            <span className="text-[#00eefc]">{selectedDay}</span>
            <span className="text-white/60">,</span>
            <span className="text-[#c3f400]">{selectedYear}</span>
          </div>

          {/* Tab Selector Bar */}
          <div className="flex bg-[#131313] p-1 rounded-xl border border-white/5 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('month')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'month'
                  ? 'bg-[#c3f400] text-[#161e00] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                  : 'text-[#e5e2e1] hover:bg-white/5'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('date')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'date'
                  ? 'bg-[#c3f400] text-[#161e00] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                  : 'text-[#e5e2e1] hover:bg-white/5'
              }`}
            >
              Date
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('year')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'year'
                  ? 'bg-[#c3f400] text-[#161e00] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                  : 'text-[#e5e2e1] hover:bg-white/5'
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
                        ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                        : 'text-[#e5e2e1] bg-white/5 hover:bg-white/10'
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
                        ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                        : isToday
                          ? 'border border-[#c3f400] text-[#c3f400] bg-[#c3f400]/5'
                          : 'text-[#e5e2e1] bg-white/5 hover:bg-white/10'
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
                        ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                        : 'text-[#e5e2e1] bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-[#c4c9ac] hover:text-white transition-colors"
            >
              Reset
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded-lg text-white transition-colors"
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
              <button
                type="button"
                className="p-2 active:scale-95 transition-transform"
                onClick={() => setIsOpen(false)}
              >
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
            <div className="overflow-y-auto p-6 space-y-4">
              {/* Summary Display */}
              <div className="text-center py-2.5 bg-white/5 rounded-xl border border-white/5 flex justify-center items-center gap-1.5 font-bold text-white text-md tracking-wide">
                <span className="text-[#c3f400]">{MONTHS[selectedMonth]}</span>
                <span className="text-[#00eefc]">{selectedDay}</span>
                <span className="text-white/60">,</span>
                <span className="text-[#c3f400]">{selectedYear}</span>
              </div>

              {/* Tab Selector Bar */}
              <div className="flex bg-[#131313] p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab('month')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'month'
                      ? 'bg-[#c3f400] text-[#161e00] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                      : 'text-[#e5e2e1] hover:bg-white/5'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('date')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'date'
                      ? 'bg-[#c3f400] text-[#161e00] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                      : 'text-[#e5e2e1] hover:bg-white/5'
                  }`}
                >
                  Date
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('year')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'year'
                      ? 'bg-[#c3f400] text-[#161e00] shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                      : 'text-[#e5e2e1] hover:bg-white/5'
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
                            ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                            : 'text-[#e5e2e1] bg-white/5 hover:bg-white/10 active:scale-95'
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
                            ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)] active:scale-95'
                            : isToday
                              ? 'border border-[#c3f400] text-[#c3f400] bg-[#c3f400]/5'
                              : 'text-white bg-white/5 hover:bg-white/10'
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
                            ? 'bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                            : 'text-white bg-white/5 hover:bg-white/10 active:scale-95'
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
                  className="flex-1 py-3 bg-white/5 text-white font-semibold rounded-xl border border-white/10 active:scale-95 transition-transform"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-3 bg-[#c3f400] text-[#161e00] font-bold rounded-xl shadow-[0_0_20px_rgba(195,244,0,0.3)] hover:opacity-90 active:scale-95 transition-transform"
                >
                  Apply
                </button>
              </div>
            </div>
            {/* Bottom safe area padding */}
            <div className="h-8 bg-[#1e1e1e]" />
          </div>
        </>
      )}
    </div>
  )
}
