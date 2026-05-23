import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import {
  getCurrentUserProfile,
  getTrainerClientsList,
  inviteClientByEmail,
  getWorkoutSessionsHistory,
  getHealthMetricsHistory,
  logHealthMetric,
  getCoachingNotes,
  saveCoachingNote,
  deleteCoachingNote,
} from '../../lib/actions'
import type {
  CoachingNoteRecord,
  HealthMetricRecord,
  MetricType,
  TrainerClientRecord,
  WorkoutSessionRecord,
} from '../../types/domain'

export const Route = createFileRoute('/clients/')({
  ssr: false,
  component: TrainerClientsPage,
})

function TrainerClientsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  // Coach and Registry states
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<TrainerClientRecord[]>([])

  // Invitation state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  // Selected client detail view states
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedClientWorkouts, setSelectedClientWorkouts] = useState<WorkoutSessionRecord[]>([])
  const [selectedClientMetrics, setSelectedClientMetrics] = useState<HealthMetricRecord[]>([])
  const [selectedClientNotes, setSelectedClientNotes] = useState<CoachingNoteRecord[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<'workouts' | 'health' | 'notes' | 'sync'>('workouts')
  const [activeMetricType, setActiveMetricType] = useState<MetricType>('weight')

  // Log client metric states
  const [metricValue, setMetricValue] = useState('')
  const [metricNotes, setMetricNotes] = useState('')
  const [metricUnit, setMetricUnit] = useState('kg')
  const [syncingMetric, setSyncingMetric] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState('')
  const [syncError, setSyncError] = useState('')
  const [noteId, setNoteId] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [notePinned, setNotePinned] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [noteStatus, setNoteStatus] = useState('')

  // Load baseline profile & check if Trainer
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
              } else if (res.user.role !== 'trainer') {
                // If not trainer, redirect to dashboard or appropriate place
                navigate({ to: '/dashboard' })
              } else {
                loadClientsRegistry()
              }
            } else {
              navigate({ to: '/onboarding' })
            }
          })
          .catch(() => setLoading(false))
      }
    }
  }, [isLoaded, isSignedIn])

  const loadClientsRegistry = async () => {
    try {
      const res = await getTrainerClientsList()
      setClients(res || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Load client metrics and workouts upon client selection
  useEffect(() => {
    if (selectedClientId) {
      setDetailLoading(true)

      const fetchWorkouts = getWorkoutSessionsHistory({ data: { clientId: selectedClientId } })
      const fetchMetrics = getHealthMetricsHistory({
        data: { clientId: selectedClientId, metricType: activeMetricType },
      })
      const fetchNotes = getCoachingNotes({ data: { clientId: selectedClientId } })

      Promise.all([fetchWorkouts, fetchMetrics, fetchNotes])
        .then(([wHist, mHist, notes]) => {
          setSelectedClientWorkouts(wHist || [])
          setSelectedClientMetrics(mHist || [])
          setSelectedClientNotes(notes || [])
          setDetailLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setDetailLoading(false)
        })
    } else {
      setSelectedClientWorkouts([])
      setSelectedClientMetrics([])
      setSelectedClientNotes([])
    }
  }, [selectedClientId, activeMetricType])

  // Sync unit with active client metric type
  useEffect(() => {
    if (activeMetricType === 'weight') setMetricUnit('kg')
    else if (activeMetricType === 'body_fat') setMetricUnit('%')
    else if (activeMetricType === 'resting_hr') setMetricUnit('bpm')
  }, [activeMetricType])

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    setInviting(true)
    setInviteError('')
    setInviteSuccess('')

    try {
      const res = await inviteClientByEmail({ data: { email: inviteEmail } })
      if (res && res.success) {
        setInviteSuccess(res.message || 'Invitation successfully dispatched!')
        setInviteEmail('')
        loadClientsRegistry()
      }
    } catch (err: unknown) {
      console.error(err)
      setInviteError(err instanceof Error ? err.message : 'Failed to dispatch client invitation.')
    } finally {
      setInviting(false)
    }
  }

  const handleClientMetricSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!metricValue || !selectedClientId) return

    setSyncingMetric(true)
    setSyncError('')
    setSyncSuccess('')

    try {
      const res = await logHealthMetric({
        data: {
          metricType: activeMetricType,
          value: parseFloat(metricValue),
          unit: metricUnit,
          notes: metricNotes || undefined,
          clientId: selectedClientId,
        },
      })

      if (res && res.success) {
        setSyncSuccess('Biometric data successfully written to athlete core!')
        setMetricValue('')
        setMetricNotes('')

        // Refresh metrics history
        const refreshed = await getHealthMetricsHistory({
          data: {
            clientId: selectedClientId,
            metricType: activeMetricType,
          },
        })
        setSelectedClientMetrics(refreshed || [])
        setTimeout(() => setSyncSuccess(''), 4000)
      }
    } catch (err: unknown) {
      console.error(err)
      setSyncError(err instanceof Error ? err.message : 'Failed to sync client health metric.')
    } finally {
      setSyncingMetric(false)
    }
  }

  const resetNoteForm = () => {
    setNoteId('')
    setNoteTitle('')
    setNoteBody('')
    setNotePinned(false)
  }

  const refreshCoachingNotes = async () => {
    if (!selectedClientId) return
    const notes = await getCoachingNotes({ data: { clientId: selectedClientId } })
    setSelectedClientNotes(notes || [])
  }

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId || !noteTitle || !noteBody) return

    setSavingNote(true)
    setNoteStatus('')

    try {
      await saveCoachingNote({
        data: {
          clientId: selectedClientId,
          noteId: noteId || undefined,
          title: noteTitle,
          body: noteBody,
          pinned: notePinned,
        },
      })
      await refreshCoachingNotes()
      resetNoteForm()
      setNoteStatus('Coaching note saved.')
      setTimeout(() => setNoteStatus(''), 3000)
    } catch (err) {
      setNoteStatus(err instanceof Error ? err.message : 'Unable to save coaching note.')
    } finally {
      setSavingNote(false)
    }
  }

  const handleNoteEdit = (note: CoachingNoteRecord) => {
    setNoteId(note.id)
    setNoteTitle(note.title)
    setNoteBody(note.body)
    setNotePinned(note.pinned === 1)
    setDetailTab('notes')
  }

  const handleNoteDelete = async (note: CoachingNoteRecord) => {
    if (!selectedClientId || !window.confirm('Delete this private coaching note?')) return

    setSavingNote(true)
    setNoteStatus('')

    try {
      await deleteCoachingNote({ data: { clientId: selectedClientId, noteId: note.id } })
      await refreshCoachingNotes()
      if (noteId === note.id) resetNoteForm()
      setNoteStatus('Coaching note deleted.')
      setTimeout(() => setNoteStatus(''), 3000)
    } catch (err) {
      setNoteStatus(err instanceof Error ? err.message : 'Unable to delete coaching note.')
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">
          Connecting to elite athlete database...
        </p>
      </div>
    )
  }

  const activePartnerships = clients.filter((c) => c.status === 'active')
  const pendingPartnerships = clients.filter((c) => c.status === 'pending')
  const selectedRel = clients.find((c) => c.client.id === selectedClientId)

  // SVG Trend Chart for Clients
  const renderClientTrendChart = () => {
    if (selectedClientMetrics.length < 2) {
      return (
        <div className="text-center py-8 border border-white/5 bg-white/[0.01] rounded-[var(--rounded-md)] text-[var(--on-surface-variant)] text-xs">
          Need at least 2 logs to construct active client trendlines.
        </div>
      )
    }

    const chronologicalData = [...selectedClientMetrics]
      .map((m) => ({
        value: Number(m.value),
        date: m.recordedAt.split('T')[0],
      }))
      .reverse()

    const values = chronologicalData.map((d) => d.value)
    const maxVal = Math.max(...values)
    const minVal = Math.min(...values)
    const valRange = maxVal - minVal
    const rangeDivisor = valRange === 0 ? 1 : valRange

    const svgWidth = 400
    const svgHeight = 160
    const paddingX = 30
    const paddingY = 20

    const points = chronologicalData.map((d, index) => {
      const x = paddingX + (index * (svgWidth - paddingX * 2)) / (chronologicalData.length - 1)
      const relativeVal = (d.value - minVal) / rangeDivisor
      const y = svgHeight - paddingY - relativeVal * (svgHeight - paddingY * 2)
      return { x, y }
    })

    const linePath = points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`
    }, '')

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    const isWeight = activeMetricType === 'weight'
    const themeHex = isWeight ? '#c3f400' : '#00eefc'

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] text-[var(--on-surface-variant)]">
          <span>
            Timeline: {chronologicalData[0].date} &rarr;{' '}
            {chronologicalData[chronologicalData.length - 1].date}
          </span>
          <span className="text-white font-bold">
            Peak: {maxVal.toFixed(1)} / Low: {minVal.toFixed(1)}
          </span>
        </div>
        <div className="border border-white/5 rounded p-2 bg-black/20">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="clientChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={themeHex} stopOpacity="0.15" />
                <stop offset="100%" stopColor={themeHex} stopOpacity="0.00" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#clientChartGrad)" />
            <path
              d={linePath}
              fill="none"
              stroke={themeHex}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#131313"
                stroke={themeHex}
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-2">
      {/* Top Banner */}
      <div className="border-b border-white/5 pb-6">
        <div className="chip chip-cyan mb-2">TRAINER REGISTRY TERMINAL</div>
        <h1 className="display-lg text-3xl font-black m-0 text-white">COACHING DESK</h1>
        <p className="body-md text-[var(--on-surface-variant)] m-0">
          Manage individual client partnerships, dispatch core invitations, log strength & cardio
          sessions, and oversee biometric profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Client List & Invite Desk */}
        <div className="lg:col-span-1 space-y-6">
          {/* Invite Form */}
          <div className="card space-y-4">
            <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary-container)]">
                person_add
              </span>
              Invite Athlete Client
            </h3>
            <p className="body-md text-[var(--on-surface-variant)] text-xs">
              Dispatch an electronic contract link. The user must be registered as an Individual.
            </p>

            {inviteSuccess && (
              <div className="p-3 text-xs rounded bg-green-950/40 border border-green-900 text-green-300">
                {inviteSuccess}
              </div>
            )}

            {inviteError && (
              <div className="p-3 text-xs rounded bg-red-950/40 border border-red-900 text-red-300">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="input-group">
                <label className="label-md text-xs text-[var(--on-surface-variant)]">
                  Athlete Account Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. client@domain.com"
                  className="input-field py-1.5"
                />
              </div>
              <button
                type="submit"
                disabled={inviting}
                className={`btn btn-primary w-full py-2 text-xs ${inviting ? 'btn-disabled' : ''}`}
              >
                {inviting ? 'Sending Invite...' : 'Dispatch Connection Invite'}
              </button>
            </form>
          </div>

          {/* Active / Pending registry lists */}
          <div className="card space-y-4">
            <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--secondary-container)]">
                assignment_ind
              </span>
              Athlete Registry ({activePartnerships.length})
            </h3>

            {activePartnerships.length === 0 && pendingPartnerships.length === 0 ? (
              <p className="body-md text-xs text-[var(--on-surface-variant)] text-center py-6">
                No active partnerships on record. Send an email invite above.
              </p>
            ) : (
              <div className="space-y-2">
                {activePartnerships.map((rel) => (
                  <button
                    key={rel.client.id}
                    onClick={() => setSelectedClientId(rel.client.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-md border transition-all text-left ${
                      selectedClientId === rel.client.id
                        ? 'bg-white/[0.04] border-[var(--primary-container)]'
                        : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div>
                      <h4 className="text-white font-bold text-sm m-0 leading-none">
                        {rel.client.name}
                      </h4>
                      <p className="text-[10px] text-[var(--on-surface-variant)] m-0 mt-1">
                        {rel.client.email}
                      </p>
                    </div>
                    <span className="chip chip-cyan py-0 px-2 text-[8px]">ACTIVE</span>
                  </button>
                ))}

                {pendingPartnerships.map((rel) => (
                  <div
                    key={rel.client.id}
                    className="w-full flex items-center justify-between p-3 rounded-md border bg-white/[0.01] border-white/5 opacity-60"
                  >
                    <div>
                      <h4 className="text-white/80 font-semibold text-sm m-0 leading-none">
                        {rel.client.name}
                      </h4>
                      <p className="text-[10px] text-[var(--on-surface-variant)] m-0 mt-1">
                        {rel.client.email}
                      </p>
                    </div>
                    <span className="chip py-0 px-2 text-[8px] bg-white/5 border-white/10 text-white/50">
                      PENDING
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Client Telemetry details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedClientId ? (
            <div className="card text-center py-24 border-dashed flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-white/10 text-6xl mb-3">
                monitoring
              </span>
              <h4 className="headline-md font-bold text-white/50 text-base">
                Select Athlete Core Terminal
              </h4>
              <p className="body-md text-[var(--on-surface-variant)] text-xs mt-1 max-w-sm">
                Click on any verified active athlete in your sidebar registry to sync and unlock
                historical performance analytics, health metrics, and workout logs.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Bio details card */}
              <div className="card space-y-4 relative overflow-hidden">
                {/* Visual glow indicator */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary-container)] rounded-full blur-[60px] opacity-10"></div>

                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-white/5 pb-4">
                  <div>
                    <div className="chip chip-cyan mb-1.5">TELEMETRY ACCESS: GRANTED</div>
                    <h2 className="headline-lg text-2xl font-black text-white m-0 uppercase">
                      {selectedRel?.client.name}
                    </h2>
                    <p className="body-md text-[var(--on-surface-variant)] text-xs m-0">
                      {selectedRel?.client.email}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/workouts/new`}
                      search={{ clientId: selectedClientId }}
                      className="btn btn-primary py-1.5 px-4 text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-sm mr-1">add</span>
                      Log Session
                    </Link>
                  </div>
                </div>

                {/* Bio Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">Height Details</span>
                    <span className="text-white font-bold text-sm block mt-1">
                      {selectedRel?.profile.height || '--'} cm
                    </span>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">Date of Birth</span>
                    <span className="text-white font-bold text-sm block mt-1">
                      {selectedRel?.profile.dateOfBirth || '--'}
                    </span>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">Activity Level</span>
                    <span className="text-white font-bold text-sm block mt-1 capitalize">
                      {selectedRel?.profile.activityLevel || '--'}
                    </span>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">Gender Identity</span>
                    <span className="text-white font-bold text-sm block mt-1 capitalize">
                      {selectedRel?.profile.gender || '--'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded text-xs">
                  <span className="text-[var(--on-surface-variant)] block font-semibold">
                    Primary Fitness Goal Target
                  </span>
                  <p className="text-white font-semibold mt-1.5 mb-0 text-sm leading-relaxed">
                    {selectedRel?.profile.fitnessGoal || 'No targeted fitness goal specified yet.'}
                  </p>
                </div>

                {selectedRel?.profile.notes && (
                  <div className="p-3.5 bg-yellow-950/20 border border-yellow-900/30 rounded text-xs text-[var(--on-surface-variant)]">
                    <span className="text-yellow-400 font-bold block mb-1">
                      Athlete Health Advisory Notes:
                    </span>
                    {selectedRel.profile.notes}
                  </div>
                )}
              </div>

              {/* Console Tabs */}
              <div className="flex border-b border-white/5 gap-2">
                <button
                  onClick={() => setDetailTab('workouts')}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                    detailTab === 'workouts'
                      ? 'border-[var(--primary-container)] text-white bg-white/[0.02]'
                      : 'border-transparent text-[var(--on-surface-variant)] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">fitness_center</span>
                  Session History ({selectedClientWorkouts.length})
                </button>
                <button
                  onClick={() => setDetailTab('health')}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                    detailTab === 'health'
                      ? 'border-[var(--secondary-container)] text-white bg-white/[0.02]'
                      : 'border-transparent text-[var(--on-surface-variant)] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">monitoring</span>
                  Biometric History
                </button>
                <button
                  onClick={() => setDetailTab('notes')}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                    detailTab === 'notes'
                      ? 'border-[var(--primary-container)] text-white bg-white/[0.02]'
                      : 'border-transparent text-[var(--on-surface-variant)] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">clinical_notes</span>
                  Coach Notes ({selectedClientNotes.length})
                </button>
                <button
                  onClick={() => setDetailTab('sync')}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                    detailTab === 'sync'
                      ? 'border-[var(--primary-container)] text-white bg-white/[0.02]'
                      : 'border-transparent text-[var(--on-surface-variant)] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">add_box</span>
                  Sync Biometrics
                </button>
              </div>

              {/* Render Tab Contents */}
              {detailLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary-container)] mx-auto"></div>
                  <p className="text-xs text-[var(--on-surface-variant)] mt-2">
                    Loading data packets...
                  </p>
                </div>
              ) : (
                <>
                  {detailTab === 'workouts' && (
                    <div className="space-y-4">
                      {selectedClientWorkouts.length === 0 ? (
                        <div className="card text-center py-12 bg-white/[0.01]">
                          <p className="body-md text-xs text-[var(--on-surface-variant)]">
                            No workout sessions logged for this athlete yet.
                          </p>
                        </div>
                      ) : (
                        selectedClientWorkouts.map((sess) => (
                          <div key={sess.id} className="card p-4 space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="headline-md text-white font-bold text-base m-0">
                                  {sess.title}
                                </h4>
                                <p className="text-[10px] text-[var(--on-surface-variant)] m-0 mt-1 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[12px]">
                                    calendar_month
                                  </span>
                                  {sess.sessionDate}
                                  {sess.durationMinutes && (
                                    <>
                                      <span className="h-1 w-1 rounded-full bg-white/20"></span>
                                      <span className="material-symbols-outlined text-[12px]">
                                        schedule
                                      </span>
                                      {sess.durationMinutes} min
                                    </>
                                  )}
                                  {sess.recordedByName !== 'Self' && (
                                    <>
                                      <span className="h-1 w-1 rounded-full bg-white/20"></span>
                                      <span className="material-symbols-outlined text-[12px]">
                                        face
                                      </span>
                                      Logged by coach: {sess.recordedByName}
                                    </>
                                  )}
                                </p>
                              </div>
                              <Link
                                to={`/workouts/${sess.id}`}
                                className="btn btn-secondary py-1 px-3 text-[10px]"
                              >
                                Details
                              </Link>
                            </div>

                            {/* Exercises overview */}
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                              {sess.exercises.map((ex) => (
                                <span key={ex.id} className="chip chip-cyan py-0.5 px-2 text-[9px]">
                                  {ex.name} ({ex.sets.length} sets)
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'health' && (
                    <div className="space-y-6">
                      {/* Metric type selectors */}
                      <div className="flex gap-2 bg-white/[0.02] p-1 rounded-md max-w-sm">
                        {(['weight', 'body_fat', 'resting_hr'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setActiveMetricType(type)}
                            className={`flex-1 py-1 px-2.5 text-[10px] font-bold uppercase rounded transition-all ${
                              activeMetricType === type
                                ? 'bg-[var(--surface-container-high)] text-white'
                                : 'text-[var(--on-surface-variant)] hover:text-white'
                            }`}
                          >
                            {type === 'weight'
                              ? 'Weight'
                              : type === 'body_fat'
                                ? 'Body Fat'
                                : 'Resting HR'}
                          </button>
                        ))}
                      </div>

                      {/* Client Chart */}
                      {renderClientTrendChart()}

                      {/* Metrics Table */}
                      <div className="card">
                        {selectedClientMetrics.length === 0 ? (
                          <p className="text-center py-6 text-xs text-[var(--on-surface-variant)]">
                            No biometric logs exist under this parameter.
                          </p>
                        ) : (
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-[var(--on-surface-variant)]">
                                <th className="py-2">Date</th>
                                <th className="py-2">Value</th>
                                <th className="py-2">Source</th>
                                <th className="py-2">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedClientMetrics.map((m) => (
                                <tr key={m.id} className="border-b border-white/[0.02]">
                                  <td className="py-2.5 font-semibold text-white">
                                    {new Date(m.recordedAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-2.5 font-bold text-white text-sm">
                                    {m.value} {m.unit}
                                  </td>
                                  <td className="py-2.5 text-[var(--on-surface-variant)]">
                                    {m.recordedByUserId === m.userId
                                      ? 'Athlete Self'
                                      : 'Coach Entry'}
                                  </td>
                                  <td className="py-2.5 text-[var(--on-surface-variant)] truncate max-w-[150px]">
                                    {m.notes || '--'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === 'notes' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="card space-y-4">
                        <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-[var(--primary-container)]">
                            edit_note
                          </span>
                          {noteId ? 'Edit Private Note' : 'New Private Note'}
                        </h3>

                        {noteStatus && (
                          <div className="p-3 text-xs rounded bg-white/[0.03] border border-white/10 text-[var(--on-surface)]">
                            {noteStatus}
                          </div>
                        )}

                        <form onSubmit={handleNoteSubmit} className="space-y-4">
                          <div className="input-group">
                            <label className="label-md text-xs text-[var(--on-surface-variant)]">
                              Note Title
                            </label>
                            <input
                              value={noteTitle}
                              onChange={(event) => setNoteTitle(event.target.value)}
                              className="input-field"
                              placeholder="e.g. Knee comfort check-in"
                            />
                          </div>
                          <div className="input-group">
                            <label className="label-md text-xs text-[var(--on-surface-variant)]">
                              Coaching Context
                            </label>
                            <textarea
                              value={noteBody}
                              onChange={(event) => setNoteBody(event.target.value)}
                              className="input-field min-h-[140px]"
                              placeholder="Private trainer-only notes, cues, adherence patterns, or follow-up items."
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs text-[var(--on-surface)]">
                            <input
                              type="checkbox"
                              checked={notePinned}
                              onChange={(event) => setNotePinned(event.target.checked)}
                            />
                            Pin to top of client notes
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={savingNote}
                              className={`btn btn-primary flex-1 ${savingNote ? 'btn-disabled' : ''}`}
                            >
                              {savingNote ? 'Saving...' : 'Save Note'}
                            </button>
                            {noteId && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={resetNoteForm}
                              >
                                New
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      <div className="space-y-3">
                        {selectedClientNotes.length === 0 ? (
                          <div className="card text-center py-12">
                            <p className="body-md text-xs text-[var(--on-surface-variant)]">
                              No private coaching notes saved for this athlete yet.
                            </p>
                          </div>
                        ) : (
                          selectedClientNotes.map((note) => (
                            <div key={note.id} className="card p-4 space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <h4 className="headline-md text-white font-bold text-base m-0">
                                    {note.pinned === 1 ? 'Pinned: ' : ''}
                                    {note.title}
                                  </h4>
                                  <p className="text-[10px] text-[var(--on-surface-variant)] mt-1">
                                    Updated {new Date(note.updatedAt).toLocaleString()}
                                  </p>
                                </div>
                                {note.pinned === 1 && (
                                  <span className="chip py-0.5 px-2 text-[8px]">PINNED</span>
                                )}
                              </div>
                              <p className="body-md text-sm text-[var(--on-surface)] whitespace-pre-wrap">
                                {note.body}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-secondary py-1 px-3 text-[10px]"
                                  onClick={() => handleNoteEdit(note)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger py-1 px-3 text-[10px]"
                                  disabled={savingNote}
                                  onClick={() => handleNoteDelete(note)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === 'sync' && (
                    <div className="card space-y-4">
                      <h3 className="headline-md text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[var(--primary-container)]">
                          add_box
                        </span>
                        Sync Client Biometrics
                      </h3>

                      {syncSuccess && (
                        <div className="p-3 text-xs rounded bg-green-950/40 border border-green-900 text-green-300">
                          {syncSuccess}
                        </div>
                      )}

                      {syncError && (
                        <div className="p-3 text-xs rounded bg-red-950/40 border border-red-900 text-red-300">
                          {syncError}
                        </div>
                      )}

                      <form onSubmit={handleClientMetricSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="input-group">
                            <label className="label-md text-xs text-[var(--on-surface-variant)] font-bold">
                              Biometric Type
                            </label>
                            <select
                              value={activeMetricType}
                              onChange={(e) => setActiveMetricType(e.target.value as any)}
                              className="input-field bg-[var(--surface-container-lowest)] text-white text-xs w-full py-2"
                            >
                              <option value="weight">Body Weight</option>
                              <option value="body_fat">Body Fat %</option>
                              <option value="resting_hr">Resting Heart Rate</option>
                            </select>
                          </div>

                          <div className="input-group">
                            <label className="label-md text-xs text-[var(--on-surface-variant)] font-bold">
                              Value ({metricUnit})
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={metricValue}
                              onChange={(e) => setMetricValue(e.target.value)}
                              placeholder={`e.g. ${activeMetricType === 'resting_hr' ? '65' : '75.2'}`}
                              className="input-field"
                            />
                          </div>
                        </div>

                        <div className="input-group">
                          <label className="label-md text-xs text-[var(--on-surface-variant)] font-bold font-sans">
                            Verification / Coach Notes
                          </label>
                          <textarea
                            value={metricNotes}
                            onChange={(e) => setMetricNotes(e.target.value)}
                            placeholder="e.g. Tracked post-workout, notes from coaching session..."
                            className="input-field min-h-[80px]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={syncingMetric}
                          className={`btn btn-primary w-full py-2.5 text-xs ${syncingMetric ? 'btn-disabled' : ''}`}
                        >
                          {syncingMetric ? 'Writing to core...' : 'Sync Athlete Biometric Log'}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
