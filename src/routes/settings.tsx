import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import { getCurrentUserProfile, updateUserProfile } from '../lib/actions'
import DatePicker from '../components/DatePicker'

export const Route = createFileRoute('/settings')({
  ssr: false,
  component: SettingsPage,
})

function SettingsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  // General state
  const [profileLoading, setProfileLoading] = useState(true)
  const [dbUser, setDbUser] = useState<any>(null)

  // Shared fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Individual fields
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState('moderate')
  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')

  // Trainer fields
  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [experience, setExperience] = useState('')

  // Submitting / UI states
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
                setName(res.user.name || '')
                setEmail(res.user.email || '')

                if (res.user.role === 'individual' && res.profile) {
                  setDob(res.profile.dateOfBirth || '')
                  setGender(res.profile.gender || '')
                  setHeight(res.profile.height ? String(res.profile.height) : '')
                  setActivity(res.profile.activityLevel || 'moderate')
                  setGoal(res.profile.fitnessGoal || '')
                  setNotes(res.profile.notes || '')
                } else if (res.user.role === 'trainer') {
                  if (res.trainerProfile) {
                    setBusinessName(res.trainerProfile.businessName || '')
                    setBio(res.trainerProfile.bio || '')
                    setSpecialization(res.trainerProfile.specialization || '')
                    setExperience(
                      res.trainerProfile.yearsExperience
                        ? String(res.trainerProfile.yearsExperience)
                        : '',
                    )
                  }
                }
                setProfileLoading(false)
              }
            } else {
              navigate({ to: '/onboarding' })
            }
          })
          .catch((err) => {
            console.error('Error fetching settings profile data:', err)
            setProfileLoading(false)
          })
      }
    }
  }, [isLoaded, isSignedIn])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const payload: any = {
        name: name.trim() || 'Kyber Athlete',
      }

      if (dbUser?.role === 'individual') {
        payload.dateOfBirth = dob || undefined
        payload.gender = gender || undefined
        payload.height = height ? parseFloat(height) : undefined
        payload.activityLevel = activity
        payload.fitnessGoal = goal || undefined
        payload.notes = notes || undefined
      } else if (dbUser?.role === 'trainer') {
        payload.businessName = businessName || undefined
        payload.bio = bio || undefined
        payload.specialization = specialization || undefined
        payload.yearsExperience = experience ? parseInt(experience) : undefined
      }

      await updateUserProfile({ data: payload })
      setSuccess(true)

      // Auto fade success alert after 4 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 4000)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to update profile settings. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">
          Retrieving biometric settings console...
        </p>
      </div>
    )
  }

  const isTrainer = dbUser?.role === 'trainer'

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <div className="chip chip-lime">PROFILE CONFIGURATION</div>
        <h1 className="display-lg text-3xl font-black m-0 text-white">
          {isTrainer ? 'COACH CREDENTIALS' : 'ATHLETE BIOMETRICS'}
        </h1>
        <p className="body-md text-[var(--on-surface-variant)] m-0">
          Modify your central registration database settings and biometric tracking defaults.
        </p>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 rounded-md bg-red-950/40 border border-red-900 text-red-300 body-md flex items-center gap-3">
          <span className="material-symbols-outlined text-red-400">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-md bg-emerald-950/40 border border-emerald-900 text-emerald-300 body-md flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <span>Biometric ledger updated successfully. Core changes saved.</span>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="text-emerald-300/60 hover:text-emerald-300"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Base Details Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <span className="material-symbols-outlined text-[var(--primary-container)]">badge</span>
            <h3 className="headline-md text-lg font-bold text-white">Base Directory Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="label-md text-[var(--on-surface-variant)]">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
                placeholder="Enter full name"
              />
            </div>
            <div className="input-group">
              <label className="label-md text-[var(--on-surface-variant)]">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled
                className="input-field bg-white/[0.02] text-white/40 border-white/5 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Conditional Cards based on Role */}
        {!isTrainer ? (
          /* Athlete Bio Metrics Card */
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <span className="material-symbols-outlined text-[var(--primary-container)]">
                fitness_center
              </span>
              <h3 className="headline-md text-lg font-bold text-white">Athlete Metrics Ledger</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">Date of Birth</label>
                <DatePicker value={dob} onChange={setDob} />
              </div>
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="input-field bg-[var(--surface-container-lowest)] text-white"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-Binary</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
              </div>
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 178"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">Activity Level</label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="input-field bg-[var(--surface-container-lowest)] text-white"
                >
                  <option value="sedentary">Sedentary (Little/no exercise)</option>
                  <option value="light">Lightly Active (1-3 days/week)</option>
                  <option value="moderate">Moderately Active (3-5 days/week)</option>
                  <option value="very-active">Very Active (6-7 days/week)</option>
                  <option value="extreme">Athlete/Professional Training</option>
                </select>
              </div>
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">
                  Primary Fitness Goal
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Body recomposition, run a 5k"
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label-md text-[var(--on-surface-variant)]">
                Medical / Injury Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="List any past injuries, physical limits, or coaching requests..."
                className="input-field min-h-[100px]"
              />
            </div>
          </div>
        ) : (
          /* Trainer Credentials Card */
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <span className="material-symbols-outlined text-[var(--secondary-container)]">
                sports
              </span>
              <h3 className="headline-md text-lg font-bold text-white">Coaching Credentials</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">
                  Business / Studio Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Kinetic Labs Studio"
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 5"
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label-md text-[var(--on-surface-variant)]">
                Specialization Areas
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Powerlifting, Olympic weightlifting, HIIT"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="label-md text-[var(--on-surface-variant)]">Bio Summary</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your training philosophy and credentials..."
                className="input-field min-h-[100px]"
              />
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`btn btn-primary flex-1 py-3.5 flex items-center justify-center gap-2 ${
              submitting ? 'btn-disabled' : ''
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                <span>Syncing Database...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">cloud_sync</span>
                <span>Apply Core Changes</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: '/dashboard' })}
            disabled={submitting}
            className="btn btn-secondary py-3.5"
          >
            Cancel & Return
          </button>
        </div>
      </form>
    </div>
  )
}
