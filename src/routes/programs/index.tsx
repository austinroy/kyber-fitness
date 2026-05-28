import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import {
  getCurrentUserProfile,
  getWorkoutPrograms,
  deleteWorkoutProgram,
  getTrainerClientsList,
  assignProgramToClient,
} from '../../lib/actions'
import type { TrainerClientRecord, WorkoutProgramSummary } from '../../types/domain'

export const Route = createFileRoute('/programs/')({
  ssr: false,
  component: ProgramsDashboardPage,
})

function ProgramsDashboardPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  // App & loading states
  const [loading, setLoading] = useState(true)
  const [programs, setPrograms] = useState<WorkoutProgramSummary[]>([])
  const [clients, setClients] = useState<TrainerClientRecord[]>([])

  // Modal / Assign States
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgramSummary | null>(null)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [coachNotes, setCoachNotes] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('none')

  const [assigning, setAssigning] = useState(false)
  const [assignSuccess, setAssignSuccess] = useState('')
  const [assignError, setAssignError] = useState('')
  const [error, setError] = useState('')

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
                navigate({ to: '/dashboard' })
              } else {
                loadProgramsData()
              }
            } else {
              navigate({ to: '/onboarding' })
            }
          })
          .catch(() => setLoading(false))
      }
    }
  }, [isLoaded, isSignedIn])

  const loadProgramsData = async () => {
    try {
      setLoading(true)
      const progs = await getWorkoutPrograms()
      setPrograms(progs || [])

      const clientRels = await getTrainerClientsList()
      const activeClients = clientRels?.filter((rel) => rel.status === 'active') || []
      setClients(activeClients)
    } catch (err) {
      console.error(err)
      setError('Failed to sync routine templates registry.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (programId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this program template? This action is irreversible.',
      )
    ) {
      return
    }

    try {
      await deleteWorkoutProgram({ data: { programId } })
      setPrograms(programs.filter((p) => p.id !== programId))
    } catch (err) {
      console.error(err)
      alert('Failed to delete workout template.')
    }
  }

  const handleOpenAssignModal = (program: WorkoutProgramSummary) => {
    setSelectedProgram(program)
    if (clients.length > 0) {
      setSelectedClientId(clients[0].client.id)
    } else {
      setSelectedClientId('')
    }
    setCoachNotes('')
    setScheduledFor('')
    setDueAt('')
    setRecurrence('none')
    setAssignSuccess('')
    setAssignError('')
    setShowAssignModal(true)
  }

  const handleAssignProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProgram || !selectedClientId) {
      setAssignError('Please select a valid athlete client.')
      return
    }

    setAssigning(true)
    setAssignError('')
    setAssignSuccess('')

    try {
      await assignProgramToClient({
        data: {
          programId: selectedProgram.id,
          clientId: selectedClientId,
          notes: coachNotes.trim() || undefined,
          scheduledFor: scheduledFor || undefined,
          dueAt: dueAt || undefined,
          recurrence,
        },
      })

      setAssignSuccess("Program successfully assigned! It is now active on the athlete's console.")

      // Update template summary list counters locally
      setPrograms(
        programs.map((p) =>
          p.id === selectedProgram.id ? { ...p, assignmentCount: p.assignmentCount + 1 } : p,
        ),
      )

      setTimeout(() => {
        setShowAssignModal(false)
      }, 2000)
    } catch (err: unknown) {
      console.error(err)
      setAssignError(err instanceof Error ? err.message : 'Failed to complete routine assignment.')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">
          Streaming program database...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-2">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="chip chip-cyan mb-2">STITCH KINETIC ROUTINE MODULE</div>
          <h1 className="display-lg text-3xl font-black m-0 text-white uppercase">
            Program Builder
          </h1>
          <p className="body-md text-[var(--on-surface-variant)] m-0">
            Design reusable coaching templates and assign them directly to athlete consoles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/programs/new" className="btn btn-primary">
            <span className="material-symbols-outlined mr-2">add</span>
            Create Template
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-950/40 border border-red-900 text-red-300 body-md">
          {error}
        </div>
      )}

      {/* Program list */}
      {programs.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-white/10 bg-white/[0.01] max-w-2xl mx-auto mt-6">
          <span className="material-symbols-outlined text-[var(--secondary-container)] text-6xl mb-4 animate-bounce">
            fitness_center
          </span>
          <h3 className="headline-lg font-black text-white text-xl">
            No program templates created yet
          </h3>
          <p className="body-md text-[var(--on-surface-variant)] text-sm max-w-md mx-auto mb-8 mt-2">
            Build specialized routine sheets containing set counts, targets, and coaching notes to
            reuse across clients.
          </p>
          <Link to="/programs/new" className="btn btn-primary px-8 py-3">
            Design First Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((prog) => (
            <div
              key={prog.id}
              className="card relative overflow-hidden transition-all duration-300 border border-[var(--secondary-container)] shadow-[0_0_15px_rgba(0,238,252,0.03)] hover:shadow-[0_0_25px_rgba(0,238,252,0.08)] flex flex-col justify-between"
            >
              {/* Decorative cyan top line */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[var(--secondary-container)]"></div>

              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="headline-md font-black text-white text-lg tracking-tight uppercase line-clamp-1">
                      {prog.title}
                    </h3>
                    <p className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider mt-1">
                      ID: {prog.id.substring(5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to="/programs/new"
                      search={{ programId: prog.id }}
                      className="btn p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-white flex items-center justify-center"
                      title="Edit Template"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(prog.id)}
                      className="btn p-1.5 bg-red-950/20 hover:bg-red-950/60 border border-red-900/30 rounded text-red-400 flex items-center justify-center"
                      title="Delete Template"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                {prog.notes ? (
                  <p className="body-md text-[var(--on-surface-variant)] text-xs line-clamp-3 m-0 italic bg-white/[0.02] p-2.5 rounded border border-white/5">
                    "{prog.notes}"
                  </p>
                ) : (
                  <p className="body-md text-[var(--on-surface-variant)] text-xs m-0 text-white/20">
                    No instructions or coaching notes provided.
                  </p>
                )}

                {prog.progressionPlan && (
                  <p className="body-md text-[var(--secondary-container)] text-xs line-clamp-3 m-0 bg-[rgba(0,238,252,0.04)] p-2.5 rounded border border-[var(--secondary-container)]/20">
                    Progression: {prog.progressionPlan}
                  </p>
                )}

                {/* Specs Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="chip chip-cyan py-0.5 px-2 text-[10px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">playlist_play</span>
                    {prog.exerciseCount} Exercises
                  </span>
                  <span className="chip py-0.5 px-2 text-[10px] flex items-center gap-1 bg-white/10 border border-white/5 text-white">
                    <span className="material-symbols-outlined text-[10px]">person</span>
                    {prog.assignmentCount} Assignments
                  </span>
                </div>
              </div>

              {/* Assignment push button */}
              <div className="border-t border-white/5 pt-4 mt-6">
                <button
                  onClick={() => handleOpenAssignModal(prog)}
                  className="btn py-2 w-full text-xs font-bold bg-[var(--secondary-container)] hover:bg-[var(--secondary-container)]/90 text-black flex items-center justify-center gap-2 rounded-md transition-all shadow-[0_0_10px_rgba(0,238,252,0.2)]"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Push to Client Console</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog: Assign Program to Client */}
      {showAssignModal && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-md space-y-6 relative border border-[var(--secondary-container)] bg-[#121212] shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <span className="chip chip-cyan mb-1 text-[9px]">DIRECT ASSIGNMENT</span>
                <h3 className="headline-md text-lg font-black text-white uppercase tracking-tight">
                  Push Routine to Athlete
                </h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-[var(--on-surface-variant)] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {assignSuccess && (
              <div className="p-4 rounded-md bg-emerald-950/40 border border-emerald-900 text-emerald-300 body-md">
                {assignSuccess}
              </div>
            )}

            {assignError && (
              <div className="p-4 rounded-md bg-red-950/40 border border-red-900 text-red-300 body-md">
                {assignError}
              </div>
            )}

            {!assignSuccess && (
              <form onSubmit={handleAssignProgram} className="space-y-4">
                <div className="p-3 bg-white/5 rounded border border-white/5 space-y-1">
                  <p className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider m-0">
                    Target Program
                  </p>
                  <p className="body-md font-bold text-white m-0 text-sm">
                    {selectedProgram.title}
                  </p>
                  <p className="text-[11px] text-[var(--on-surface-variant)] m-0">
                    Consists of {selectedProgram.exerciseCount} target movements.
                  </p>
                </div>

                <div className="input-group">
                  <label className="label-md text-xs text-[var(--on-surface-variant)]">
                    Select Active Athlete
                  </label>
                  {clients.length === 0 ? (
                    <div className="p-3 rounded bg-red-950/10 border border-red-900/20 text-red-300 text-xs">
                      No active clients currently registered. Go to <strong>My Clients</strong> to
                      link client consoles.
                    </div>
                  ) : (
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
                      required
                    >
                      {clients.map((c) => (
                        <option key={c.client.id} value={c.client.id}>
                          {c.client.name} ({c.client.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="input-group">
                  <label className="label-md text-xs text-[var(--on-surface-variant)]">
                    Coach Instruction Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Write a custom note for the athlete (e.g., 'Try this custom set for your leg day today! Keep weights moderate.')"
                    value={coachNotes}
                    onChange={(e) => setCoachNotes(e.target.value)}
                    className="input-field bg-[var(--surface-container-lowest)] text-white w-full min-h-[100px] resize-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="input-group">
                    <label className="label-md text-xs text-[var(--on-surface-variant)]">
                      Scheduled For
                    </label>
                    <input
                      type="date"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
                    />
                  </div>
                  <div className="input-group">
                    <label className="label-md text-xs text-[var(--on-surface-variant)]">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueAt}
                      onChange={(e) => setDueAt(e.target.value)}
                      className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="label-md text-xs text-[var(--on-surface-variant)]">
                    Recurrence
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) =>
                      setRecurrence(e.target.value as 'none' | 'weekly' | 'biweekly' | 'monthly')
                    }
                    className="input-field bg-[var(--surface-container-lowest)] text-white w-full"
                  >
                    <option value="none">One-time assignment</option>
                    <option value="weekly">Weekly routine</option>
                    <option value="biweekly">Biweekly routine</option>
                    <option value="monthly">Monthly routine</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="btn btn-secondary py-1.5 px-4 text-xs"
                    disabled={assigning}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn py-1.5 px-6 text-xs bg-[var(--secondary-container)] hover:bg-[var(--secondary-container)]/90 text-black font-bold"
                    disabled={assigning || clients.length === 0}
                  >
                    {assigning ? 'Syncing Assignment...' : 'Push Direct'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
