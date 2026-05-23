import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import {
  getCurrentUserProfile,
  getIndividualTrainersList,
  respondToTrainerInvitation,
} from '../../lib/actions'
import type { TrainerRelationshipRecord, UserRecord } from '../../types/domain'

export const Route = createFileRoute('/my-trainers/')({
  ssr: false,
  component: MyTrainersPage,
})

function MyTrainersPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  // State Management
  const [loading, setLoading] = useState(true)
  const [dbUser, setDbUser] = useState<UserRecord | null>(null)
  const [trainers, setTrainers] = useState<TrainerRelationshipRecord[]>([])

  // Interactive responding states
  const [actingId, setActingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

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
              } else if (res.user.role !== 'individual') {
                // If trainer, redirect to dashboard or clients page
                navigate({ to: '/dashboard' })
              } else {
                setDbUser(res.user)
                loadTrainers()
              }
            } else {
              navigate({ to: '/onboarding' })
            }
          })
          .catch(() => setLoading(false))
      }
    }
  }, [isLoaded, isSignedIn])

  const loadTrainers = async () => {
    try {
      const list = await getIndividualTrainersList()
      setTrainers(list || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvitationResponse = async (relationshipId: string, accept: boolean) => {
    setActingId(relationshipId)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await respondToTrainerInvitation({
        data: {
          relationshipId,
          accept,
        },
      })

      if (res && res.success) {
        setSuccessMsg(
          accept
            ? 'Trainer relationship successfully authorized! Performance sharing is now active.'
            : 'Trainer invitation declined.',
        )
        // Refresh trainer connections
        await loadTrainers()
        setTimeout(() => setSuccessMsg(''), 5000)
      }
    } catch (err: unknown) {
      console.error(err)
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to submit response to trainer invitation.',
      )
    } finally {
      setActingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">
          Connecting to coach network...
        </p>
      </div>
    )
  }

  const activeTrainers = trainers.filter((t) => t.status === 'active')
  const pendingInvitations = trainers.filter((t) => t.status === 'pending')

  return (
    <div className="space-y-8 py-2 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="chip chip-cyan mb-2">ATHLETE NETWORK GATE</div>
        <h1 className="display-lg text-3xl font-black m-0 text-white font-sans">MY TRAINERS</h1>
        <p className="body-md text-[var(--on-surface-variant)] m-0">
          Manage authorized trainers, review coaching credentials, and manage permission overrides
          for logging biometrics or training sessions.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-md bg-green-950/40 border border-green-900 text-green-300 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-md bg-red-950/40 border border-red-900 text-red-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="headline-md text-lg font-black text-[var(--primary-container)] flex items-center gap-2">
            <span className="material-symbols-outlined animate-pulse text-[var(--primary-container)]">
              notifications_active
            </span>
            PENDING CONNECTION REQUESTS ({pendingInvitations.length})
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="card relative overflow-hidden border-[var(--primary-container)] space-y-4 bg-white/[0.02]"
              >
                {/* Header info */}
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <span className="chip chip-cyan text-[8px] mb-1">PROPOSAL DEPLOYED</span>
                    <h3 className="headline-md font-bold text-white text-base m-0">
                      {inv.trainer.name}
                    </h3>
                    <p className="body-md text-[var(--on-surface-variant)] text-xs m-0">
                      {inv.trainer.email}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleInvitationResponse(inv.id, false)}
                      disabled={actingId !== null}
                      className="btn btn-secondary py-1.5 px-4 text-xs font-bold"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleInvitationResponse(inv.id, true)}
                      disabled={actingId !== null}
                      className="btn btn-primary py-1.5 px-4 text-xs font-bold"
                    >
                      {actingId === inv.id ? 'Authorizing...' : 'Approve Connection'}
                    </button>
                  </div>
                </div>

                {/* Trainer Profile Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4 text-xs">
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">Coaching Brand</span>
                    <span className="text-white font-bold block mt-1">
                      {inv.trainerProfile.businessName || 'Elite Performance'}
                    </span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">
                      Primary Specialization
                    </span>
                    <span className="text-white font-bold block mt-1">
                      {inv.trainerProfile.specialization || 'General Fitness'}
                    </span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">
                      Professional Experience
                    </span>
                    <span className="text-white font-bold block mt-1">
                      {inv.trainerProfile.yearsExperience || 0} years
                    </span>
                  </div>
                </div>

                {inv.trainerProfile.bio && (
                  <p className="body-md text-[var(--on-surface-variant)] text-xs leading-relaxed border-t border-white/5 pt-3 mb-0">
                    <span className="text-white font-bold">Trainer Bio: </span>"
                    {inv.trainerProfile.bio}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Authorized Trainers Section */}
      <div className="space-y-4">
        <h2 className="headline-md text-lg font-black text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--secondary-container)]">
            verified_user
          </span>
          AUTHORIZED PERFORMANCE COACHES ({activeTrainers.length})
        </h2>

        {activeTrainers.length === 0 ? (
          <div className="card text-center py-16 border-dashed space-y-4">
            <span className="material-symbols-outlined text-white/10 text-5xl">sports</span>
            <div>
              <h4 className="headline-md font-bold text-white/50 text-sm">
                Your training terminal is currently running solo
              </h4>
              <p className="body-md text-[var(--on-surface-variant)] text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
                Connect with a professional coach to grant permission to log workouts and record
                metrics on your behalf. Provide your coach with your registered email:
              </p>
            </div>
            <div className="inline-block px-4 py-2 bg-white/[0.03] border border-white/5 rounded font-mono text-xs text-white">
              {dbUser?.email}
            </div>
            <p className="text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wider">
              Once they send an invitation, it will manifest here for authorization approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeTrainers.map((con) => (
              <div
                key={con.id}
                className="card relative overflow-hidden space-y-4 bg-white/[0.01] hover:bg-white/[0.02] border-white/5 transition-all"
              >
                {/* Visual accent line */}
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary-container)]"></div>

                <div className="flex flex-wrap justify-between items-start gap-4 pl-2">
                  <div>
                    <span className="chip chip-cyan text-[8px] mb-1.5">PARTNERSHIP ACTIVE</span>
                    <h3 className="headline-md font-bold text-white text-base m-0">
                      {con.trainer.name}
                    </h3>
                    <p className="body-md text-[var(--on-surface-variant)] text-xs m-0 mt-0.5">
                      {con.trainer.email}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[var(--on-surface-variant)] block">
                      Connected on
                    </span>
                    <span className="text-white text-xs font-semibold block mt-0.5">
                      {new Date(con.createdAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </span>
                  </div>
                </div>

                {/* Trainer parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4 text-xs pl-2">
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">Coaching Studio</span>
                    <span className="text-white font-bold block mt-1">
                      {con.trainerProfile.businessName || 'Elite Training'}
                    </span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">
                      Core Specialization
                    </span>
                    <span className="text-white font-bold block mt-1">
                      {con.trainerProfile.specialization || 'Performance'}
                    </span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                    <span className="text-[var(--on-surface-variant)] block">Years Active</span>
                    <span className="text-white font-bold block mt-1">
                      {con.trainerProfile.yearsExperience || 0} years
                    </span>
                  </div>
                </div>

                {con.trainerProfile.bio && (
                  <p className="body-md text-[var(--on-surface-variant)] text-xs leading-relaxed border-t border-white/5 pt-3 pl-2 mb-0">
                    <span className="text-white font-bold">Trainer Statement: </span>"
                    {con.trainerProfile.bio}"
                  </p>
                )}

                {/* Scope of permissions box */}
                <div className="p-3.5 bg-green-950/10 border border-green-900/20 rounded text-[10px] text-[var(--on-surface-variant)] flex items-start gap-2.5 pl-3">
                  <span className="material-symbols-outlined text-[var(--primary-container)] text-base mt-0.5">
                    verified
                  </span>
                  <div>
                    <span className="text-white font-bold block uppercase tracking-wider mb-0.5">
                      Authorized Scope of Permissions
                    </span>
                    This certified performance trainer holds secure system permissions to construct
                    training session records and write biometrics logs (e.g. weight, body fat) on
                    your behalf. Your personal dashboard is synchronized with these records in
                    real-time.
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
