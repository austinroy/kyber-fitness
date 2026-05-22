import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import {
  getCurrentUserProfile,
  getHealthMetricsHistory,
  logHealthMetric,
  getTrainerClientsList,
} from '../../lib/actions'

export const Route = createFileRoute('/health/')({
  ssr: false,
  component: HealthDashboardPage,
})

function HealthDashboardPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  // App & Session states
  const [profileLoading, setProfileLoading] = useState(true)
  const [dbUser, setDbUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [clientsList, setClientsList] = useState<any[]>([])

  // Dashboard selections
  const [selectedClientId, setSelectedClientId] = useState('')
  const [activeMetric, setActiveMetric] = useState<'weight' | 'body_fat' | 'resting_hr'>('weight')
  const [metricsHistory, setMetricsHistory] = useState<any[]>([])

  // Logger Form States
  const [logValue, setLogValue] = useState('')
  const [logUnit, setLogUnit] = useState('kg')
  const [logNotes, setLogNotes] = useState('')
  const [logForClientId, setLogForClientId] = useState('')
  const [logging, setLogging] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Load and sync dashboard details
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        navigate({ to: '/sign-in' })
      } else {
        getCurrentUserProfile()
          .then((res) => {
            if (res && res.authenticated) {
              if (!res.onboarded) {
                navigate({ to: '/onboarding' })
              } else {
                setDbUser(res.user)
                setProfile(res.profile)

                // If trainer, fetch clients
                if (res.user.role === 'trainer') {
                  getTrainerClientsList()
                    .then((clients) => {
                      const active = clients?.filter((c: any) => c.status === 'active') || []
                      setClientsList(active)
                    })
                    .catch(() => {})
                }
              }
            } else {
              navigate({ to: '/onboarding' })
            }
          })
          .catch(() => {})
      }
    }
  }, [isLoaded, isSignedIn])

  // Fetch metrics whenever selected client or active metric changes
  useEffect(() => {
    if (isSignedIn) {
      setProfileLoading(true)
      getHealthMetricsHistory({
        data: {
          clientId: selectedClientId || undefined,
          metricType: activeMetric,
        },
      })
        .then((data) => {
          setMetricsHistory(data || [])
          setProfileLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setProfileLoading(false)
        })
    }
  }, [isSignedIn, selectedClientId, activeMetric])

  // Dynamic Unit synchronization for the form
  useEffect(() => {
    if (activeMetric === 'weight') {
      setLogUnit('kg')
    } else if (activeMetric === 'body_fat') {
      setLogUnit('%')
    } else if (activeMetric === 'resting_hr') {
      setLogUnit('bpm')
    }
  }, [activeMetric])

  const handleMetricSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logValue) return

    setLogging(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await logHealthMetric({
        data: {
          metricType: activeMetric,
          value: parseFloat(logValue),
          unit: logUnit,
          notes: logNotes || undefined,
          clientId: dbUser?.role === 'trainer' ? logForClientId || undefined : undefined,
        },
      })

      if (res && res.success) {
        setSuccessMsg('Biometrics successfully synced to core telemetry database!')
        setLogValue('')
        setLogNotes('')

        // Refresh metrics history
        const refreshed = await getHealthMetricsHistory({
          data: {
            clientId: selectedClientId || undefined,
            metricType: activeMetric,
          },
        })
        setMetricsHistory(refreshed || [])

        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err?.message || 'Failed to submit health metrics.')
    } finally {
      setLogging(false)
    }
  }

  if (!isLoaded || (profileLoading && metricsHistory.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">
          Streaming biometric telemetry...
        </p>
      </div>
    )
  }

  const isTrainer = dbUser?.role === 'trainer'

  // Metric info helpers
  const getMetricLabel = (type: string) => {
    switch (type) {
      case 'weight':
        return 'Body Weight'
      case 'body_fat':
        return 'Body Fat Percentage'
      case 'resting_hr':
        return 'Resting Heart Rate'
      default:
        return 'Metrics'
    }
  }

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'weight':
        return 'scale'
      case 'body_fat':
        return 'percent'
      case 'resting_hr':
        return 'favorite'
      default:
        return 'monitoring'
    }
  }

  const getMetricUnit = (type: string) => {
    switch (type) {
      case 'weight':
        return 'kg'
      case 'body_fat':
        return '%'
      case 'resting_hr':
        return 'bpm'
      default:
        return ''
    }
  }

  // --- SVG Dynamic Trend Curve Generator ---
  const generateTrendChart = () => {
    if (metricsHistory.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-[240px] border border-white/5 bg-white/[0.01] rounded-[var(--rounded-md)] text-center p-6">
          <span className="material-symbols-outlined text-white/10 text-5xl mb-2">insights</span>
          <h4 className="headline-md font-bold text-white/50 text-sm">
            Awaiting sufficient timeline data
          </h4>
          <p className="body-md text-[var(--on-surface-variant)] text-xs mt-1 max-w-xs">
            Submit at least two logs to project premium performance vectors and rolling progress
            lines.
          </p>
        </div>
      )
    }

    // Chronological order for drawing left-to-right
    const chronologicalData = [...metricsHistory]
      .map((m) => ({
        id: m.id,
        value: Number(m.value),
        date: m.recordedAt.split('T')[0],
      }))
      .reverse()

    const values = chronologicalData.map((d) => d.value)
    const maxVal = Math.max(...values)
    const minVal = Math.min(...values)
    const valRange = maxVal - minVal

    // SVG parameters
    const svgWidth = 600
    const svgHeight = 240
    const paddingX = 40
    const paddingY = 30

    // Prevent divide by zero if values are identical
    const rangeDivisor = valRange === 0 ? 1 : valRange
    const valueMultiplier = valRange === 0 ? 0.5 : 1

    const points = chronologicalData.map((d, index) => {
      const x = paddingX + (index * (svgWidth - paddingX * 2)) / (chronologicalData.length - 1)
      const relativeVal = (d.value - minVal) / rangeDivisor
      const y = svgHeight - paddingY - relativeVal * (svgHeight - paddingY * 2)
      return { x, y, value: d.value, date: d.date }
    })

    // Construct line path
    const linePath = points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`
    }, '')

    // Construct area gradient path under the curve
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
        : ''

    const isWeight = activeMetric === 'weight'
    const themeColor = isWeight ? 'var(--primary-container)' : 'var(--secondary-container)'
    const themeHex = isWeight ? '#c3f400' : '#00eefc'

    return (
      <div className="card space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--secondary-container)]">
                trending_up
              </span>
              Biometric Performance Vectors
            </h3>
            <p className="body-md text-[var(--on-surface-variant)] text-xs mt-0.5">
              Timeline trend from {chronologicalData[0].date} to{' '}
              {chronologicalData[chronologicalData.length - 1].date}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-white font-semibold">
              <span className="h-2 w-2 rounded-full bg-[var(--primary-container)]"></span>
              Peak: {maxVal.toFixed(1)} {getMetricUnit(activeMetric)}
            </span>
            <span className="flex items-center gap-1.5 text-white font-semibold">
              <span className="h-2 w-2 rounded-full bg-[var(--secondary-container)]"></span>
              Low: {minVal.toFixed(1)} {getMetricUnit(activeMetric)}
            </span>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[500px] h-auto overflow-visible select-none"
          >
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={themeHex} stopOpacity="0.25" />
                <stop offset="100%" stopColor={themeHex} stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
              const y = paddingY + r * (svgHeight - paddingY * 2)
              const val = maxVal - r * valRange
              return (
                <g key={i} className="opacity-15">
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text x={paddingX - 10} y={y + 4} fill="#ffffff" fontSize="9" textAnchor="end">
                    {val.toFixed(0)}
                  </text>
                </g>
              )
            })}

            {/* Gradient underlay */}
            <path d={areaPath} fill="url(#chartGrad)" />

            {/* Glowing trendline */}
            <path
              d={linePath}
              fill="none"
              stroke={themeHex}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_rgba(195,244,0,0.4)]"
            />

            {/* Glowing points */}
            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="7" fill="#131313" stroke={themeHex} strokeWidth="2" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill={themeHex}
                  className="transition-transform group-hover:scale-150 duration-200"
                />

                {/* Micro tooltip */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect
                    x={p.x - 45}
                    y={p.y - 36}
                    width="90"
                    height="24"
                    rx="4"
                    fill="#2a2a2a"
                    stroke="#ffffff"
                    strokeWidth="0.5"
                    strokeOpacity="0.2"
                  />
                  <text
                    x={p.x}
                    y={p.y - 20}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {p.value.toFixed(1)} {getMetricUnit(activeMetric)}
                  </text>
                </g>
              </g>
            ))}
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="chip chip-cyan mb-2">HEALTH METRICS CORE</div>
          <h1 className="display-lg text-3xl font-black m-0 text-white">BIOMETRICS CONSOLE</h1>
          <p className="body-md text-[var(--on-surface-variant)] m-0">
            Track dated physical variables, monitor chronological progress, and project biological
            benchmarks.
          </p>
        </div>

        {/* Dynamic selectors for Trainer client review */}
        {isTrainer && (
          <div className="input-group min-w-[200px]">
            <label className="label-md text-xs text-[var(--on-surface-variant)]">
              Review Athlete Profile
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="input-field bg-[var(--surface-container-lowest)] text-white text-xs w-full py-2"
            >
              <option value="">Personal Biometrics (Self)</option>
              {clientsList.map((c) => (
                <option key={c.client.id} value={c.client.id}>
                  {c.client.name} (Client)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs configuration */}
      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => setActiveMetric('weight')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeMetric === 'weight'
              ? 'border-[var(--primary-container)] text-white bg-white/[0.02]'
              : 'border-transparent text-[var(--on-surface-variant)] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm">scale</span>
          Body Weight
        </button>
        <button
          onClick={() => setActiveMetric('body_fat')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeMetric === 'body_fat'
              ? 'border-[var(--secondary-container)] text-white bg-white/[0.02]'
              : 'border-transparent text-[var(--on-surface-variant)] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm">percent</span>
          Body Fat
        </button>
        <button
          onClick={() => setActiveMetric('resting_hr')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeMetric === 'resting_hr'
              ? 'border-[var(--secondary-container)] text-white bg-white/[0.02]'
              : 'border-transparent text-[var(--on-surface-variant)] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm">favorite</span>
          Resting HR
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Trend SVG & Log List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Line Render */}
          {generateTrendChart()}

          {/* Metrics History Log List */}
          <div className="card space-y-4">
            <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary-container)]">
                receipt_long
              </span>
              Dated Telemetry Log entries
            </h3>

            {metricsHistory.length === 0 ? (
              <div className="text-center py-12 text-[var(--on-surface-variant)]">
                <span className="material-symbols-outlined text-4xl opacity-20 mb-2">database</span>
                <p className="body-md text-xs">
                  No records tracked under {getMetricLabel(activeMetric)} yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[var(--on-surface-variant)]">
                      <th className="py-2.5">Sync Timestamp</th>
                      <th className="py-2.5">Recorded Value</th>
                      <th className="py-2.5">Sync Terminal</th>
                      <th className="py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricsHistory.map((m) => (
                      <tr key={m.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                        <td className="py-3 font-semibold text-white">
                          {new Date(m.recordedAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 text-white font-bold text-sm">
                          {Number(m.value).toFixed(1)}{' '}
                          <span className="text-[10px] text-[var(--on-surface-variant)] font-normal">
                            {m.unit}
                          </span>
                        </td>
                        <td className="py-3 text-[var(--on-surface-variant)]">
                          {m.recordedByUserId === m.userId
                            ? 'Individual Core'
                            : 'Trainer Portal Override'}
                        </td>
                        <td
                          className="py-3 text-[var(--on-surface-variant)] truncate max-w-[200px]"
                          title={m.notes || ''}
                        >
                          {m.notes || '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Log Sync Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card space-y-4">
            <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary-container)]">
                add_box
              </span>
              Sync Bio Telemetry
            </h3>
            <p className="body-md text-[var(--on-surface-variant)] text-xs">
              Manually append a secure datum point into the active biometric telemetry timeline.
            </p>

            {successMsg && (
              <div className="p-3 text-xs rounded bg-green-950/40 border border-green-900 text-green-300">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 text-xs rounded bg-red-950/40 border border-red-900 text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleMetricSubmit} className="space-y-4">
              {/* Trainer Designated logging target client selection */}
              {isTrainer && (
                <div className="input-group">
                  <label className="label-md text-xs text-[var(--on-surface-variant)]">
                    Designate Sync Target
                  </label>
                  <select
                    value={logForClientId}
                    onChange={(e) => setLogForClientId(e.target.value)}
                    className="input-field bg-[var(--surface-container-lowest)] text-white w-full py-2"
                  >
                    <option value="">Self (Personal record)</option>
                    {clientsList.map((c) => (
                      <option key={c.client.id} value={c.client.id}>
                        {c.client.name} (Client)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">
                  {getMetricLabel(activeMetric)} ({getMetricUnit(activeMetric)})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={logValue}
                    onChange={(e) => setLogValue(e.target.value)}
                    placeholder={`e.g. ${activeMetric === 'resting_hr' ? '60' : activeMetric === 'body_fat' ? '12.5' : '75.0'}`}
                    className="input-field w-full pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] text-xs font-bold font-sans">
                    {getMetricUnit(activeMetric)}
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">
                  Verification / Notes
                </label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g., Logged pre-breakfast, fasted status"
                  className="input-field min-h-[80px]"
                />
              </div>

              <button
                type="submit"
                disabled={logging}
                className={`btn btn-primary w-full py-2.5 text-xs ${logging ? 'btn-disabled' : ''}`}
              >
                {logging ? 'Synchronizing Telemetry...' : 'Sync Telemetry Log'}
              </button>
            </form>
          </div>

          {/* Metric Core Technical Advice Info Box */}
          <div className="card bg-white/[0.01] border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary-container)]">
                info
              </span>
              <h4 className="headline-md font-bold text-white text-xs uppercase tracking-wider m-0">
                Performance Insights
              </h4>
            </div>
            <p className="body-md text-[var(--on-surface-variant)] text-xs leading-relaxed">
              Consistently recording biometric variables helps map metabolic adaptation charts.
              Trainers with active partnerships can input telemetry override data, which maps into
              your charts securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
