import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import { getCurrentUserProfile, updateUserProfile } from '../lib/actions'
import DatePicker from '../components/DatePicker'
import type { UserRecord } from '../types/domain'
import type { UpdateUserProfilePayload } from '../types/profile-forms'

export const Route = createFileRoute('/settings')({
  ssr: false,
  component: SettingsPage,
})

function SettingsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  // General state
  const [profileLoading, setProfileLoading] = useState(true)
  const [dbUser, setDbUser] = useState<UserRecord | null>(null)

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
  const [navLayout, setNavLayout] = useState<'floating' | 'full-bleed' | 'sidebar'>('floating')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('kyber_header_layout')
      if (stored === 'full-bleed' || stored === 'floating' || stored === 'sidebar') {
        setNavLayout(stored)
      }
    }
  }, [])

  const handleNavLayoutChange = (layout: 'floating' | 'full-bleed' | 'sidebar') => {
    setNavLayout(layout)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('kyber_header_layout', layout)
      window.dispatchEvent(new Event('kyber_header_layout_change'))
    }
  }

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
      const payload: UpdateUserProfilePayload = {
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
    } catch (err: unknown) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : 'Failed to update profile settings. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">Loading settings...</p>
      </div>
    )
  }

  const isTrainer = dbUser?.role === 'trainer'

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <div className="chip chip-lime">ACCOUNT & PREFERENCES</div>
        <h1 className="display-lg text-3xl font-black m-0 text-white">Settings</h1>
        <p className="body-md text-[var(--on-surface-variant)] m-0">
          Manage your personal details, training preferences, and app navigation.
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
            <span>Settings saved successfully.</span>
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
            <h3 className="headline-md text-lg font-bold text-white">Profile Information</h3>
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
              <label className="label-md text-[var(--on-surface-variant)]">Email Address</label>
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
              <h3 className="headline-md text-lg font-bold text-white">About You</h3>
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
                  <option value="extreme">Very intense training</option>
                </select>
              </div>
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">Fitness Goal</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Build strength, run a 5k"
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label-md text-[var(--on-surface-variant)]">
                Health & Injury Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="List any past injuries, physical limits, or notes for your coach..."
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
              <h3 className="headline-md text-lg font-bold text-white">Coaching Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">
                  Business or Gym Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Peak Performance Gym"
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
              <label className="label-md text-[var(--on-surface-variant)]">Specialties</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Strength training, endurance, mobility"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="label-md text-[var(--on-surface-variant)]">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your coaching philosophy and background..."
                className="input-field min-h-[100px]"
              />
            </div>
          </div>
        )}

        {/* Appearance & Navigation Layout Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--secondary-container)]">
                dashboard_customize
              </span>
              <h3 className="headline-md text-lg font-bold text-white">Navigation Style</h3>
            </div>
          </div>

          <p className="body-md text-[var(--on-surface-variant)] text-xs">
            Pick how you want to navigate the app. Changes apply right away.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Floating Island Option */}
            <button
              type="button"
              onClick={() => handleNavLayoutChange('floating')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                navLayout === 'floating'
                  ? 'border-[#D4FF00] bg-[#D4FF00]/10 shadow-[0_0_20px_rgba(212,255,0,0.15)]'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Floating Island</span>
                {navLayout === 'floating' && (
                  <span className="w-2 h-2 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]"></span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Glass capsule floating at top of screen with mobile bottom dock.
              </p>
              <span className="mt-3 inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-[#D4FF00]/15 text-[#D4FF00] font-bold">
                DEFAULT
              </span>
            </button>

            {/* Full-Bleed Top Bar Option */}
            <button
              type="button"
              onClick={() => handleNavLayoutChange('full-bleed')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                navLayout === 'full-bleed'
                  ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Full-Bleed Top Bar</span>
                {navLayout === 'full-bleed' && (
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]"></span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Edge-to-edge sticky top navigation bar across the viewport.
              </p>
              <span className="mt-3 inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-bold">
                CLASSIC
              </span>
            </button>

            {/* Classic Sidebar Option */}
            <button
              type="button"
              onClick={() => handleNavLayoutChange('sidebar')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                navLayout === 'sidebar'
                  ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Left Sidebar Rail</span>
                {navLayout === 'sidebar' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]"></span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Dedicated desktop left navigation rail with sticky links.
              </p>
              <span className="mt-3 inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-bold">
                DESKTOP RAIL
              </span>
            </button>
          </div>
        </div>

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
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Save Changes</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: '/dashboard' })}
            disabled={submitting}
            className="btn btn-secondary py-3.5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
