import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import { getCurrentUserProfile, getWorkoutSessionsHistory, logHealthMetric } from '../lib/actions'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  // App States
  const [profileLoading, setProfileLoading] = useState(true)
  const [dbUser, setDbUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [trainerProfile, setTrainerProfile] = useState<any>(null)
  const [workouts, setWorkouts] = useState<any[]>([])
  
  // Quick log states
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [logSuccess, setLogSuccess] = useState(false)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        navigate({ to: '/sign-in' })
      } else {
        // Fetch details
        getCurrentUserProfile()
          .then((res) => {
            if (res && res.authenticated) {
              if (!res.onboarded) {
                navigate({ to: '/onboarding' })
              } else {
                setDbUser(res.user)
                setProfile(res.profile)
                setTrainerProfile(res.trainerProfile)
                
                // Fetch recent workouts
                getWorkoutSessionsHistory()
                  .then((hist) => {
                    setWorkouts(hist || [])
                    setProfileLoading(false)
                  })
                  .catch(() => setProfileLoading(false))
              }
            } else {
              navigate({ to: '/onboarding' })
            }
          })
          .catch(() => {
            setProfileLoading(false)
          })
      }
    }
  }, [isLoaded, isSignedIn])

  const handleQuickWeightLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight) return
    setLogging(true)
    try {
      await logHealthMetric({
        data: {
          metricType: 'weight',
          value: parseFloat(weight),
          unit: 'kg',
          notes: notes || undefined,
        }
      })
      setWeight('')
      setNotes('')
      setLogSuccess(true)
      setTimeout(() => setLogSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setLogging(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">Streaming biometric console...</p>
      </div>
    )
  }

  const isTrainer = dbUser?.role === 'trainer'

  return (
    <div className="space-y-8 py-2">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="chip chip-cyan mb-2">PORTAL ACTIVE</div>
          <h1 className="display-lg text-3xl font-black m-0 text-white capitalize">
            {isTrainer ? 'COACH TERMINAL' : 'ATHLETE CONSOLE'}
          </h1>
          <p className="body-md text-[var(--on-surface-variant)] m-0">
            Biometric sync ok. Logged in as <span className="text-white font-bold">{dbUser?.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/workouts/new" className="btn btn-primary">
            <span className="material-symbols-outlined mr-2">add</span>
            Log Activity
          </Link>
        </div>
      </div>

      {/* Profile Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {isTrainer ? (
          <>
            <div className="card card-featured">
              <span className="material-symbols-outlined text-[var(--secondary-container)] text-3xl mb-2">sports</span>
              <p className="label-md text-[var(--on-surface-variant)] m-0">Coaching Hub</p>
              <h2 className="headline-lg font-black text-white mt-1">{trainerProfile?.businessName || 'Elite Training'}</h2>
            </div>
            <div className="card">
              <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl mb-2">group</span>
              <p className="label-md text-[var(--on-surface-variant)] m-0">Active Partnerships</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="metric-xl text-3xl leading-none">Manage</span>
              </div>
              <Link to="/clients" className="label-md text-[var(--secondary-container)] text-xs font-bold hover:underline block mt-3">Open Client Desk &rarr;</Link>
            </div>
            <div className="card">
              <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl mb-2">military_tech</span>
              <p className="label-md text-[var(--on-surface-variant)] m-0">Specialization</p>
              <h3 className="headline-md font-bold text-white text-base mt-2 line-clamp-2">{trainerProfile?.specialization || 'General Strength'}</h3>
            </div>
            <div className="card">
              <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl mb-2">history</span>
              <p className="label-md text-[var(--on-surface-variant)] m-0">Experience</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="metric-xl text-4xl">{trainerProfile?.yearsExperience || 0}</span>
                <span className="body-md text-[var(--on-surface-variant)] text-xs">years</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card card-featured">
              <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl mb-2">fitness_center</span>
              <p className="label-md text-[var(--on-surface-variant)] m-0">Total Workouts</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="metric-xl text-5xl leading-none">{workouts.length}</span>
                <span className="body-md text-[var(--on-surface-variant)] text-xs">sessions</span>
              </div>
            </div>
            <div className="card">
              <span className="material-symbols-outlined text-[var(--secondary-container)] text-3xl mb-2">height</span>
              <p className="label-md text-[var(--on-surface-variant)] m-0">Height Details</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="metric-xl text-4xl">{profile?.height || '--'}</span>
                <span className="body-md text-[var(--on-surface-variant)] text-xs">cm</span>
              </div>
            </div>
            <div className="card col-span-2">
              <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl mb-2">track_changes</span>
              <p className="label-md text-[var(--on-surface-variant)] m-0">Current Target Goal</p>
              <h3 className="headline-md font-bold text-white text-base mt-2">{profile?.fitnessGoal || 'No goal set yet. Modify in profile onboarding.'}</h3>
            </div>
          </>
        )}
      </div>

      {/* Main Body Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="headline-md text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary-container)]">receipt_long</span>
              Recent Sessions History
            </h3>
            <Link to="/workouts" className="label-md text-[var(--primary-container)] text-xs hover:underline">View All &rarr;</Link>
          </div>

          {workouts.length === 0 ? (
            <div className="card text-center py-12 border-dashed">
              <span className="material-symbols-outlined text-white/20 text-5xl mb-3">fitness_center</span>
              <h4 className="headline-md font-bold text-white/70 text-lg">No sessions recorded yet</h4>
              <p className="body-md text-[var(--on-surface-variant)] text-sm mb-6">Initialize your performance sync by adding your first workout.</p>
              <Link to="/workouts/new" className="btn btn-primary px-6 py-2.5">Record First Session</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.slice(0, 3).map((sess) => (
                <div key={sess.id} className="card relative overflow-hidden">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="headline-md text-white font-bold text-base m-0">{sess.title}</h4>
                        <span className="chip py-0.5 px-2 text-[10px]">{sess.exercises.length} Exercises</span>
                      </div>
                      <p className="body-md text-[var(--on-surface-variant)] text-xs m-0 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">calendar_month</span>
                        {sess.sessionDate}
                        {sess.durationMinutes && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-white/20"></span>
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {sess.durationMinutes} min
                          </>
                        )}
                        {sess.recordedByName !== 'Self' && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-white/20"></span>
                            <span className="material-symbols-outlined text-xs">face</span>
                            Logged by Trainer {sess.recordedByName}
                          </>
                        )}
                      </p>
                    </div>
                    <Link to={`/workouts/${sess.id}`} className="btn btn-secondary py-1 px-3 text-[10px]">Details</Link>
                  </div>
                  
                  {/* Exercises list summary */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
                    {sess.exercises.map((ex: any) => (
                      <span key={ex.id} className="chip chip-cyan py-0.5 px-2 text-[10px]">
                        {ex.name} ({ex.sets.length} sets)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic widgets */}
        <div className="space-y-6">
          {!isTrainer ? (
            /* Quick Weight Log Widget for Individuals */
            <div className="card space-y-4">
              <h3 className="headline-md text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--secondary-container)]">scale</span>
                Quick Weight Log
              </h3>
              <p className="body-md text-[var(--on-surface-variant)] text-xs">
                Log today's weight to maintain your visual progress trend curve.
              </p>

              {logSuccess && (
                <div className="p-2 text-xs rounded bg-green-950/40 border border-green-900 text-green-300">
                  Metric synced to health core!
                </div>
              )}

              <form onSubmit={handleQuickWeightLog} className="space-y-4">
                <div className="input-group">
                  <label className="label-md text-xs text-[var(--on-surface-variant)]">Body Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 78.5"
                    className="input-field py-1.5"
                  />
                </div>
                <div className="input-group">
                  <label className="label-md text-xs text-[var(--on-surface-variant)]">Notes (optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Post-workout"
                    className="input-field py-1.5"
                  />
                </div>
                <button
                  type="submit"
                  disabled={logging}
                  className={`btn btn-primary w-full py-2 text-xs ${logging ? 'btn-disabled' : ''}`}
                >
                  {logging ? 'Syncing...' : 'Sync Biometrics'}
                </button>
              </form>
            </div>
          ) : (
            /* Coaching Desk shortcuts for Trainers */
            <div className="card space-y-4">
              <h3 className="headline-md text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--secondary-container)]">support_agent</span>
                Client Administration
              </h3>
              <p className="body-md text-[var(--on-surface-variant)] text-xs">
                Invite individuals, log workout schedules, and review dynamic logs.
              </p>
              <div className="space-y-2 pt-2">
                <Link to="/clients" className="btn btn-primary w-full text-xs py-2">
                  <span className="material-symbols-outlined text-sm mr-1">group</span>
                  View Client Registry
                </Link>
              </div>
            </div>
          )}

          {/* Quick tips card */}
          <div className="card bg-white/[0.01] border-white/5">
            <span className="material-symbols-outlined text-[var(--primary-container)] text-2xl mb-2">tips_and_updates</span>
            <h4 className="headline-md font-bold text-white text-sm m-0">Performance Insights</h4>
            <p className="body-md text-[var(--on-surface-variant)] text-xs mt-2 leading-relaxed">
              Consistently logging weight at the same time daily creates a cleaner, highly accurate rolling weight trendline. Make sure to log post-waking!
            </p>
          </div>

        </div>

      </div>

    </div>
  )
}
