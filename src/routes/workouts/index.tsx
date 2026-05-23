import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import { getWorkoutSessionsHistory, getCurrentUserProfile } from '../../lib/actions'
import type { WorkoutSessionRecord } from '../../types/domain'

export const Route = createFileRoute('/workouts/')({
  ssr: false,
  component: WorkoutsPage,
})

function WorkoutsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([])
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionRecord | null>(null)

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
                getWorkoutSessionsHistory()
                  .then((hist) => {
                    setSessions(hist || [])
                    if (hist && hist.length > 0) {
                      setSelectedSession(hist[0])
                    }
                    setLoading(false)
                  })
                  .catch(() => setLoading(false))
              }
            } else {
              navigate({ to: '/onboarding' })
            }
          })
          .catch(() => setLoading(false))
      }
    }
  }, [isLoaded, isSignedIn])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">
          Streaming activity database...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-2">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <div className="chip mb-1">PERFORMANCE ARCHIVES</div>
          <h1 className="headline-lg font-black text-white m-0">WORKOUT HISTORY</h1>
        </div>
        <Link to="/workouts/new" className="btn btn-primary">
          <span className="material-symbols-outlined mr-2">add</span>
          Log Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-16">
          <span className="material-symbols-outlined text-white/10 text-6xl mb-4">
            fitness_center
          </span>
          <h3 className="headline-md font-bold text-white text-xl">No workouts in database</h3>
          <p className="body-md text-[var(--on-surface-variant)] max-w-md mx-auto mt-2 mb-6">
            Keep moving! Log your strength resistance training or aerobic cardiorespiratory metrics
            to begin analysis.
          </p>
          <Link to="/workouts/new" className="btn btn-primary px-8 py-3">
            Log Activity Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List panel */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="label-md text-[var(--on-surface-variant)] text-xs mb-2">
              Logs ({sessions.length})
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2">
              {sessions.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => setSelectedSession(sess)}
                  className={`card text-left w-full relative transition-all block cursor-pointer ${
                    selectedSession?.id === sess.id
                      ? 'border-[var(--primary-container)] bg-white/[0.03]'
                      : 'border-white/5 bg-[var(--surface-container)] hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="font-bold text-white text-base truncate m-0">{sess.title}</h4>
                    <span className="text-[10px] text-[var(--on-surface-variant)] whitespace-nowrap">
                      {sess.sessionDate}
                    </span>
                  </div>
                  <p className="body-md text-xs text-[var(--on-surface-variant)] mt-1 mb-3">
                    {sess.exercises.length} exercise{sess.exercises.length === 1 ? '' : 's'}{' '}
                    recorded
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {sess.exercises.map((ex) => (
                      <span key={ex.id} className="chip py-0.5 px-2 text-[8px]">
                        {ex.name}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details panel */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="card space-y-6">
                {/* Detail Header */}
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h2 className="headline-lg text-2xl font-black text-white m-0">
                      {selectedSession.title}
                    </h2>
                    <p className="body-md text-xs text-[var(--on-surface-variant)] mt-1.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      {selectedSession.sessionDate}
                      {selectedSession.durationMinutes && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-white/20"></span>
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {selectedSession.durationMinutes} min
                        </>
                      )}
                      {selectedSession.location && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-white/20"></span>
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {selectedSession.location}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="label-md text-[var(--on-surface-variant)] text-[10px] m-0">
                      Recorded By
                    </p>
                    <p className="body-md text-xs font-bold text-white mt-0.5 capitalize">
                      {selectedSession.recordedByName}
                    </p>
                  </div>
                </div>

                {/* Session Notes */}
                {selectedSession.notes && (
                  <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
                    <p className="label-md text-[var(--on-surface-variant)] text-[10px] m-0">
                      Session Notes
                    </p>
                    <p className="body-md text-sm text-white mt-1 m-0 italic">
                      "{selectedSession.notes}"
                    </p>
                  </div>
                )}

                {/* Exercises & Sets details list */}
                <div className="space-y-6">
                  <h3 className="label-md text-[var(--primary-container)] text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">toc</span>
                    Volume & Set Details
                  </h3>

                  {selectedSession.exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="p-4 rounded-md border border-white/5 bg-[var(--surface-container-low)] space-y-4"
                    >
                      {/* Exercise Name and category */}
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="label-md text-xs text-white/40">#{idx + 1}</span>
                          <h4 className="headline-md text-white font-bold text-base m-0">
                            {ex.name}
                          </h4>
                        </div>
                        <span className="chip chip-cyan py-0.5 px-2 text-[10px]">
                          {ex.category}
                        </span>
                      </div>

                      {/* Exercise Notes */}
                      {ex.notes && (
                        <p className="body-md text-xs text-[var(--on-surface-variant)] m-0 italic">
                          Note: {ex.notes}
                        </p>
                      )}

                      {/* Sets table */}
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-[var(--on-surface-variant)]">
                            <th className="py-2 font-semibold">Set</th>
                            {ex.category === 'cardio' ? (
                              <>
                                <th className="py-2 font-semibold">Duration</th>
                                <th className="py-2 font-semibold">Distance</th>
                              </>
                            ) : (
                              <>
                                <th className="py-2 font-semibold">Reps</th>
                                <th className="py-2 font-semibold">Weight</th>
                              </>
                            )}
                            <th className="py-2 font-semibold">Rest</th>
                            <th className="py-2 font-semibold">Intensity</th>
                            <th className="py-2 font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ex.sets.map((set) => (
                            <tr
                              key={set.id}
                              className="border-b border-white/[0.02] hover:bg-white/[0.01]"
                            >
                              <td className="py-2 font-bold text-white">#{set.setNumber}</td>
                              {ex.category === 'cardio' ? (
                                <>
                                  <td className="py-2 text-[var(--on-surface)]">
                                    {set.durationSeconds
                                      ? `${Math.floor(set.durationSeconds / 60)}m ${set.durationSeconds % 60}s`
                                      : '--'}
                                  </td>
                                  <td className="py-2 text-[var(--on-surface)]">
                                    {set.distance
                                      ? `${set.distance} ${ex.defaultUnit || 'km'}`
                                      : '--'}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-2 text-[var(--on-surface)]">
                                    {set.reps ?? '--'}
                                  </td>
                                  <td className="py-2 text-[var(--on-surface)]">
                                    {set.weight ? `${set.weight} ${ex.defaultUnit || 'kg'}` : '--'}
                                  </td>
                                </>
                              )}
                              <td className="py-2 text-white/50">
                                {set.restSeconds ? `${set.restSeconds}s` : '--'}
                              </td>
                              <td className="py-2 text-white/70">{set.intensity || '--'}</td>
                              <td className="py-2 text-white/50 italic truncate max-w-[120px]">
                                {set.notes || '--'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center py-20 bg-white/[0.01] border-white/5 border-dashed">
                <span className="material-symbols-outlined text-white/5 text-5xl">description</span>
                <p className="body-md text-[var(--on-surface-variant)] mt-2">
                  Select a session from the archives to review performance biometrics.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
