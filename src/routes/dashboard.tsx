import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import {
  getCurrentUserProfile,
  getWorkoutSessionsHistory,
  logHealthMetric,
  getClientAssignedPrograms,
  getTrainerClientsList,
  getWorkoutPrograms,
} from '../lib/actions'
import type {
  ProgramAssignmentRecord,
  ProfileRecord,
  TrainerClientRecord,
  TrainerProfileRecord,
  UserRecord,
  WorkoutProgramSummary,
  WorkoutSessionRecord,
} from '../types/domain'

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  component: DashboardPage,
})

function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  // App States
  const [profileLoading, setProfileLoading] = useState(true)
  const [dbUser, setDbUser] = useState<UserRecord | null>(null)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfileRecord | null>(null)
  const [workouts, setWorkouts] = useState<WorkoutSessionRecord[]>([])
  const [assignedPrograms, setAssignedPrograms] = useState<ProgramAssignmentRecord[]>([])
  const [trainerClients, setTrainerClients] = useState<TrainerClientRecord[]>([])
  const [programs, setPrograms] = useState<WorkoutProgramSummary[]>([])

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

                const isAthlete = res.user.role === 'individual'
                const workoutFetch = getWorkoutSessionsHistory()
                const assignFetch = isAthlete
                  ? getClientAssignedPrograms({ data: { status: 'pending' } })
                  : Promise.resolve([])
                const clientFetch = !isAthlete ? getTrainerClientsList() : Promise.resolve([])
                const programFetch = !isAthlete ? getWorkoutPrograms() : Promise.resolve([])

                Promise.all([workoutFetch, assignFetch, clientFetch, programFetch])
                  .then(([hist, assigned, clientsList, programsList]) => {
                    setWorkouts(hist || [])
                    setAssignedPrograms(assigned || [])
                    setTrainerClients(clientsList || [])
                    setPrograms(programsList || [])
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
        },
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 dark:border-white/10 border-t-lime-600 dark:border-t-[#D4FF00]"></div>
        <p className="body-md text-slate-500 dark:text-zinc-400 text-xs mt-4">
          Loading your dashboard...
        </p>
      </div>
    )
  }

  const isTrainer = dbUser?.role === 'trainer'
  const activeClients = trainerClients.filter((c) => c.status === 'active')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 md:space-y-8 py-2">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
        <div className="min-w-0">
          <div className="chip chip-cyan mb-2">{isTrainer ? 'COACH CONSOLE' : 'DASHBOARD'}</div>
          <h1 className="display-lg text-2xl sm:text-3xl font-black m-0 text-slate-900 dark:text-white capitalize break-words">
            {isTrainer ? 'Coach Dashboard' : 'Athlete Dashboard'}
          </h1>
          <p className="body-md text-slate-600 dark:text-zinc-400 text-xs sm:text-sm m-0 mt-0.5">
            Welcome back,{' '}
            <span className="text-slate-900 dark:text-white font-bold">{dbUser?.name}</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          {isTrainer ? (
            <>
              <Link to="/clients" className="btn btn-secondary text-xs flex-1 sm:flex-initial">
                <span className="material-symbols-outlined mr-1 text-sm">groups</span>
                Clients ({trainerClients.length})
              </Link>
              <Link to="/programs/new" className="btn btn-secondary text-xs flex-1 sm:flex-initial">
                <span className="material-symbols-outlined mr-1 text-sm">library_add</span>
                New Program
              </Link>
              <Link to="/workouts/new" className="btn btn-primary text-xs flex-1 sm:flex-initial">
                <span className="material-symbols-outlined mr-1 text-sm">add</span>
                Log Workout
              </Link>
            </>
          ) : (
            <Link to="/workouts/new" className="btn btn-primary text-xs w-full sm:w-auto">
              <span className="material-symbols-outlined mr-1 text-sm">add</span>
              Log a Workout
            </Link>
          )}
        </div>
      </div>

      {/* Pending Coach Assignments Banner for Athletes */}
      {!isTrainer && assignedPrograms.length > 0 && (
        <div className="space-y-4">
          {assignedPrograms.map((assign) => (
            <div
              key={assign.id}
              className="card relative overflow-hidden p-4 sm:p-6 border border-cyan-500/30 dark:border-[var(--secondary-container)] bg-gradient-to-r from-cyan-500/5 to-transparent shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-6"
            >
              {/* Left design glow border overlay */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-600 dark:bg-[var(--secondary-container)]"></div>

              <div className="space-y-2 flex-1 pl-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip chip-cyan text-[9px] uppercase font-black tracking-widest">
                    ASSIGNED BY {assign.trainerName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Received {new Date(assign.assignedAt).toLocaleDateString()}
                  </span>
                  {assign.recurrence && assign.recurrence !== 'none' && (
                    <span className="chip py-0.5 px-2 text-[9px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/5">
                      {assign.recurrence}
                    </span>
                  )}
                </div>

                <h3 className="headline-md text-slate-900 dark:text-white font-black text-lg sm:text-xl tracking-tight uppercase m-0 break-words">
                  {assign.programTitle}
                </h3>

                {assign.notes && (
                  <p className="body-md text-slate-600 dark:text-zinc-400 text-xs m-0 italic bg-slate-50 dark:bg-white/[0.02] p-3 rounded border border-slate-200 dark:border-white/5 max-w-2xl">
                    Note: "{assign.notes}"
                  </p>
                )}

                {(assign.scheduledFor || assign.dueAt) && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    {assign.scheduledFor && (
                      <span>Scheduled {new Date(assign.scheduledFor).toLocaleDateString()}</span>
                    )}
                    {assign.dueAt && <span>Due {new Date(assign.dueAt).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <Link
                  to="/workouts/new"
                  search={{ assignmentId: assign.id }}
                  className="btn btn-secondary text-xs font-bold py-2 px-4 w-full md:w-auto flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm font-bold">
                    fitness_center
                  </span>
                  <span>Start Workout</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {isTrainer ? (
          <>
            {/* Card 1: Your Business */}
            <div className="card">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-[#00F0FF] dark:bg-[#00F0FF]/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">sports</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold m-0">
                Your Business
              </p>
              <h2 className="headline-lg text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 break-words">
                {trainerProfile?.businessName || 'Independent Coach'}
              </h2>
              <div className="mt-2.5">
                <span className="chip chip-cyan py-0.5 px-2 text-[10px] inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                  Verified Coach
                </span>
              </div>
            </div>

            {/* Card 2: Client Network */}
            <div className="card">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 text-lime-700 dark:text-[#D4FF00] dark:bg-[#D4FF00]/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">groups</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold m-0">
                Client Network
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tabular-nums">
                  {trainerClients.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  {activeClients.length} active
                </span>
              </div>
              <Link
                to="/clients"
                className="text-xs font-bold text-cyan-700 dark:text-[#00F0FF] hover:underline flex items-center gap-1 mt-2.5"
              >
                View client roster{' '}
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>

            {/* Card 3: Program Templates */}
            <div className="card">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-[#00F0FF] dark:bg-[#00F0FF]/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">splitscreen</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold m-0">
                Program Templates
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tabular-nums">
                  {programs.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  routines
                </span>
              </div>
              <Link
                to="/programs"
                className="text-xs font-bold text-cyan-700 dark:text-[#00F0FF] hover:underline flex items-center gap-1 mt-2.5"
              >
                Manage programs{' '}
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>

            {/* Card 4: Coaching Experience */}
            <div className="card">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 text-lime-700 dark:text-[#D4FF00] dark:bg-[#D4FF00]/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">military_tech</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold m-0">
                Coaching Experience
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tabular-nums">
                  {trainerProfile?.yearsExperience || 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">years</span>
              </div>
              <p
                className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-2.5 truncate"
                title={trainerProfile?.specialization || 'Strength & Conditioning'}
              >
                {trainerProfile?.specialization || 'Strength & Conditioning'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="card">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 text-lime-700 dark:text-[#D4FF00] dark:bg-[#D4FF00]/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">fitness_center</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold m-0">
                Completed Workouts
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tabular-nums">
                  {workouts.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  sessions
                </span>
              </div>
            </div>

            <div className="card">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-[#00F0FF] dark:bg-[#00F0FF]/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">height</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold m-0">
                Height
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tabular-nums">
                  {profile?.height || '--'}
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">cm</span>
              </div>
            </div>

            <div className="card sm:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 text-lime-700 dark:text-[#D4FF00] dark:bg-[#D4FF00]/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-xl">track_changes</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold m-0">
                Primary Goal
              </p>
              <h3 className="headline-md font-bold text-slate-900 dark:text-white text-base mt-1 break-words">
                {profile?.fitnessGoal || 'No goal set yet. Add one in Settings.'}
              </h3>
            </div>
          </>
        )}
      </div>

      {/* Main Body Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: Recent Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-lime-500/10 text-lime-700 dark:text-[#D4FF00] dark:bg-[#D4FF00]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-base">receipt_long</span>
              </div>
              <h3 className="headline-md text-lg sm:text-xl font-bold text-slate-900 dark:text-white m-0">
                Recent Workouts
              </h3>
            </div>
            <Link
              to="/workouts"
              className="label-md text-lime-700 dark:text-[#D4FF00] text-xs font-bold hover:underline flex items-center gap-1"
            >
              View All <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>

          {workouts.length === 0 ? (
            <div className="card text-center py-12 border-dashed border-slate-200 dark:border-white/10">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-zinc-500">
                <span className="material-symbols-outlined text-2xl">fitness_center</span>
              </div>
              <h4 className="headline-md font-bold text-slate-900 dark:text-white text-lg m-0">
                No workouts logged yet
              </h4>
              <p className="body-md text-slate-600 dark:text-zinc-400 text-xs max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
                {isTrainer
                  ? 'Log your personal workouts or test training splits before assigning them to your clients.'
                  : 'Start tracking your sets, reps, and weights to see your progress trends over time.'}
              </p>
              <Link to="/workouts/new" className="btn btn-primary text-xs px-4 py-2">
                <span className="material-symbols-outlined text-sm mr-1.5">add</span>
                Log Your First Session
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.slice(0, 3).map((sess) => (
                <div key={sess.id} className="card relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h4 className="headline-md text-slate-900 dark:text-white font-bold text-base m-0 break-words">
                          {sess.title}
                        </h4>
                        <span className="chip py-0.5 px-2 text-[10px]">
                          {sess.exercises.length} Exercises
                        </span>
                      </div>
                      <p className="body-md text-slate-600 dark:text-zinc-400 text-xs m-0 flex flex-wrap items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">calendar_month</span>
                        {sess.sessionDate}
                        {sess.durationMinutes && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {sess.durationMinutes} min
                          </>
                        )}
                        {sess.recordedByName !== 'Self' && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                            <span className="material-symbols-outlined text-xs">face</span>
                            Logged by Trainer {sess.recordedByName}
                          </>
                        )}
                      </p>
                    </div>
                    <Link
                      to={`/workouts/${sess.id}`}
                      className="btn btn-secondary py-1 px-3 text-xs w-full sm:w-auto"
                    >
                      Details
                    </Link>
                  </div>

                  {/* Exercises list summary */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                    {sess.exercises.map((ex) => (
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
          {isTrainer ? (
            <>
              {/* Coaching Desk shortcuts for Trainers */}
              <div className="card space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-[#00F0FF]/10 text-cyan-700 dark:text-[#00F0FF] flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                  </div>
                  <h3 className="headline-md text-base font-bold text-slate-900 dark:text-white m-0">
                    Coach Shortcuts
                  </h3>
                </div>
                <p className="body-md text-slate-600 dark:text-zinc-400 text-xs m-0">
                  Quick access to client management, program builder, and coaching tools.
                </p>
                <div className="space-y-2 pt-1">
                  <Link
                    to="/clients"
                    className="btn btn-secondary w-full text-xs justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">groups</span>
                      <span>Client Roster</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300 font-mono">
                      {trainerClients.length}
                    </span>
                  </Link>
                  <Link
                    to="/programs"
                    className="btn btn-secondary w-full text-xs justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">splitscreen</span>
                      <span>Workout Programs</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300 font-mono">
                      {programs.length}
                    </span>
                  </Link>
                  <Link
                    to="/programs/new"
                    className="btn btn-primary w-full text-xs justify-center"
                  >
                    <span className="material-symbols-outlined text-sm mr-1">add</span>
                    <span>Create New Program</span>
                  </Link>
                </div>
              </div>

              {/* Client Roster Snapshot Card */}
              {trainerClients.length > 0 ? (
                <div className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-lime-500/10 dark:bg-[#D4FF00]/10 text-lime-700 dark:text-[#D4FF00] flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">person</span>
                      </div>
                      <h4 className="headline-md font-bold text-slate-900 dark:text-white text-sm m-0">
                        Recent Clients
                      </h4>
                    </div>
                    <Link
                      to="/clients"
                      className="text-xs font-bold text-cyan-700 dark:text-[#00F0FF] hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-white/5 pt-1">
                    {trainerClients.slice(0, 3).map((rel) => (
                      <div
                        key={rel.id}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 dark:text-white truncate m-0">
                            {rel.client.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate m-0">
                            {rel.client.email}
                          </p>
                        </div>
                        <span
                          className={`chip text-[9px] uppercase font-bold ${
                            rel.status === 'active'
                              ? 'chip-cyan'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-zinc-300'
                          }`}
                        >
                          {rel.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card p-5 space-y-3 border-dashed border-slate-200 dark:border-white/10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-[#00F0FF] dark:bg-[#00F0FF]/10 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-xl">person_add</span>
                  </div>
                  <h4 className="headline-md font-bold text-slate-900 dark:text-white text-sm m-0">
                    Invite Your First Athlete
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 m-0 leading-relaxed">
                    Send email invites to start building programs and tracking client workouts.
                  </p>
                  <Link to="/clients" className="btn btn-secondary w-full text-xs">
                    Send Client Invite
                  </Link>
                </div>
              )}

              {/* Coaching Guidance Card */}
              <div className="card space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-lime-500/10 dark:bg-[#D4FF00]/10 text-lime-700 dark:text-[#D4FF00] flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">tips_and_updates</span>
                  </div>
                  <h4 className="headline-md font-bold text-slate-900 dark:text-white text-sm m-0">
                    Coaching Guidance
                  </h4>
                </div>
                <p className="body-md text-slate-600 dark:text-zinc-400 text-xs leading-relaxed m-0">
                  Review client workout completion logs and health trends weekly to calibrate
                  exercise loads and prevent burnout.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Quick Weight Log Widget for Individuals */}
              <div className="card space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-[#00F0FF]/10 text-cyan-700 dark:text-[#00F0FF] flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">scale</span>
                  </div>
                  <h3 className="headline-md text-base font-bold text-slate-900 dark:text-white m-0">
                    Quick Weight Log
                  </h3>
                </div>
                <p className="body-md text-slate-600 dark:text-zinc-400 text-xs m-0">
                  Log your weight to keep your progress charts and trends up to date.
                </p>

                {logSuccess && (
                  <div className="p-2 text-xs rounded bg-green-950/40 border border-green-900 text-green-300">
                    Weight saved!
                  </div>
                )}

                <form onSubmit={handleQuickWeightLog} className="space-y-4">
                  <div className="input-group">
                    <label className="label-md text-xs text-slate-600 dark:text-zinc-400">
                      Body Weight (kg)
                    </label>
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
                    <label className="label-md text-xs text-slate-600 dark:text-zinc-400">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Morning, fasted"
                      className="input-field py-1.5"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={logging}
                    className={`btn btn-primary w-full py-2 text-xs ${logging ? 'btn-disabled' : ''}`}
                  >
                    {logging ? 'Saving...' : 'Save Weight'}
                  </button>
                </form>
              </div>

              {/* Quick tips card */}
              <div className="card space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-lime-500/10 dark:bg-[#D4FF00]/10 text-lime-700 dark:text-[#D4FF00] flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">tips_and_updates</span>
                  </div>
                  <h4 className="headline-md font-bold text-slate-900 dark:text-white text-sm m-0">
                    Training Tip
                  </h4>
                </div>
                <p className="body-md text-slate-600 dark:text-zinc-400 text-xs leading-relaxed m-0">
                  Weigh yourself at the same time each day—ideally right after waking up—for the
                  most consistent trendline.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
