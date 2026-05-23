import { useUser } from '@clerk/tanstack-start'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  deleteWorkoutSession,
  getCurrentUserProfile,
  getWorkoutSessionDetails,
  updateWorkoutSession,
} from '../../lib/actions'
import type { WorkoutSessionRecord } from '../../types/domain'

export const Route = createFileRoute('/workouts/$sessionId')({
  ssr: false,
  component: WorkoutSessionDetailPage,
})

function WorkoutSessionDetailPage() {
  const { sessionId } = Route.useParams()
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()
  const [session, setSession] = useState<WorkoutSessionRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [title, setTitle] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const loadSession = async () => {
    const details = await getWorkoutSessionDetails({ data: { sessionId } })
    setSession(details)
    setTitle(details.title)
    setSessionDate(details.sessionDate)
    setDurationMinutes(details.durationMinutes ? String(details.durationMinutes) : '')
    setLocation(details.location || '')
    setNotes(details.notes || '')
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      navigate({ to: '/sign-in' })
      return
    }

    getCurrentUserProfile()
      .then((profile) => {
        if (!profile?.onboarded) {
          navigate({ to: '/onboarding' })
          return
        }

        loadSession()
          .catch((err) => {
            setErrorMsg(err instanceof Error ? err.message : 'Unable to load workout session.')
          })
          .finally(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [isLoaded, isSignedIn, sessionId])

  const totalSets = useMemo(
    () => session?.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0) || 0,
    [session],
  )

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!session) return

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await updateWorkoutSession({
        data: {
          sessionId: session.id,
          title,
          sessionDate,
          durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
          location: location || undefined,
          notes: notes || undefined,
          exercises: session.exercises.map((exercise, exerciseIndex) => ({
            exerciseId: exercise.exerciseId,
            notes: exercise.notes || undefined,
            orderIndex: exerciseIndex,
            sets: exercise.sets.map((set, setIndex) => ({
              setNumber: setIndex + 1,
              reps: set.reps || undefined,
              weight: set.weight || undefined,
              durationSeconds: set.durationSeconds || undefined,
              distance: set.distance || undefined,
              restSeconds: set.restSeconds || undefined,
              intensity: set.intensity || undefined,
              notes: set.notes || undefined,
            })),
          })),
        },
      })

      await loadSession()
      setIsEditing(false)
      setSuccessMsg('Workout session updated.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update workout session.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!session || !window.confirm('Delete this workout session permanently?')) return

    setSaving(true)
    setErrorMsg('')

    try {
      await deleteWorkoutSession({ data: { sessionId: session.id } })
      navigate({ to: '/workouts' })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete workout session.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">Loading session details...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="card text-center py-16">
        <h1 className="headline-md font-bold text-white">Workout session unavailable</h1>
        <p className="body-md text-[var(--on-surface-variant)]">{errorMsg}</p>
        <Link to="/workouts" className="btn btn-primary mt-4">
          Back to History
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="chip mb-1">SESSION DETAIL</div>
          <h1 className="headline-lg font-black text-white m-0">{session.title}</h1>
          <p className="body-md text-[var(--on-surface-variant)] text-xs mt-1">
            {session.exercises.length} exercises / {totalSets} sets / recorded by{' '}
            {session.recordedByName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/workouts" className="btn btn-secondary">
            Back
          </Link>
          <button className="btn btn-secondary" onClick={() => setIsEditing((value) => !value)}>
            {isEditing ? 'Close Edit' : 'Edit'}
          </button>
          <button className="btn btn-danger" disabled={saving} onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

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

      {isEditing && (
        <form onSubmit={handleSave} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group md:col-span-2">
            <label className="label-md text-xs text-[var(--on-surface-variant)]">Title</label>
            <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="label-md text-xs text-[var(--on-surface-variant)]">Date</label>
            <input
              className="input-field"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="label-md text-xs text-[var(--on-surface-variant)]">Duration</label>
            <input
              className="input-field"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
          <div className="input-group md:col-span-2">
            <label className="label-md text-xs text-[var(--on-surface-variant)]">Location</label>
            <input
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="input-group md:col-span-2">
            <label className="label-md text-xs text-[var(--on-surface-variant)]">Notes</label>
            <textarea
              className="input-field min-h-[90px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button className="btn btn-primary md:col-span-2" disabled={saving}>
            {saving ? 'Saving...' : 'Save Session'}
          </button>
        </form>
      )}

      <div className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-md border border-white/5 bg-white/[0.02]">
            <p className="label-md text-[var(--on-surface-variant)] text-[10px]">Date</p>
            <p className="body-md text-white font-bold">{session.sessionDate}</p>
          </div>
          <div className="p-3 rounded-md border border-white/5 bg-white/[0.02]">
            <p className="label-md text-[var(--on-surface-variant)] text-[10px]">Duration</p>
            <p className="body-md text-white font-bold">{session.durationMinutes || '--'} min</p>
          </div>
          <div className="p-3 rounded-md border border-white/5 bg-white/[0.02]">
            <p className="label-md text-[var(--on-surface-variant)] text-[10px]">Location</p>
            <p className="body-md text-white font-bold">{session.location || '--'}</p>
          </div>
        </div>

        {session.notes && (
          <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
            <p className="label-md text-[var(--on-surface-variant)] text-[10px]">Session Notes</p>
            <p className="body-md text-sm text-white mt-1 m-0 italic">"{session.notes}"</p>
          </div>
        )}

        {session.exercises.map((exercise, exerciseIndex) => (
          <div key={exercise.id} className="p-4 rounded-md border border-white/5 bg-white/[0.02]">
            <div className="flex justify-between gap-3 border-b border-white/5 pb-2">
              <h2 className="headline-md text-white font-bold text-base m-0">
                #{exerciseIndex + 1} {exercise.name}
              </h2>
              <span className="chip chip-cyan py-0.5 px-2 text-[10px]">{exercise.category}</span>
            </div>
            {exercise.notes && (
              <p className="body-md text-xs text-[var(--on-surface-variant)] mt-3 italic">
                {exercise.notes}
              </p>
            )}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[var(--on-surface-variant)]">
                    <th className="py-2">Set</th>
                    <th className="py-2">Reps</th>
                    <th className="py-2">Weight</th>
                    <th className="py-2">Duration</th>
                    <th className="py-2">Distance</th>
                    <th className="py-2">Rest</th>
                    <th className="py-2">Intensity</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set) => (
                    <tr key={set.id} className="border-b border-white/[0.02]">
                      <td className="py-2 font-bold text-white">#{set.setNumber}</td>
                      <td className="py-2 text-[var(--on-surface)]">{set.reps ?? '--'}</td>
                      <td className="py-2 text-[var(--on-surface)]">
                        {set.weight ? `${set.weight} ${exercise.defaultUnit || 'kg'}` : '--'}
                      </td>
                      <td className="py-2 text-[var(--on-surface)]">
                        {set.durationSeconds ? `${set.durationSeconds}s` : '--'}
                      </td>
                      <td className="py-2 text-[var(--on-surface)]">
                        {set.distance ? `${set.distance} ${exercise.defaultUnit || 'km'}` : '--'}
                      </td>
                      <td className="py-2 text-white/50">
                        {set.restSeconds ? `${set.restSeconds}s` : '--'}
                      </td>
                      <td className="py-2 text-white/70">{set.intensity || '--'}</td>
                      <td className="py-2 text-white/50 italic">{set.notes || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
