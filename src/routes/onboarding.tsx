import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-start'
import { useEffect, useState } from 'react'
import { getCurrentUserProfile, onboardUser } from '../lib/actions'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

function OnboardingPage() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  // Form State
  const [role, setRole] = useState<'individual' | 'trainer'>('individual')
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

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        navigate({ to: '/sign-in' })
      } else {
        setName(clerkUser.fullName || clerkUser.username || '')
        setEmail(clerkUser.primaryEmailAddress?.emailAddress || '')

        // Check if already onboarded
        getCurrentUserProfile()
          .then((res) => {
            if (res && res.onboarded) {
              navigate({ to: '/dashboard' })
            } else {
              setChecking(false);
            }
          })
          .catch(() => {
            setChecking(false);
          })
      }
    }
  }, [isLoaded, isSignedIn])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload: any = {
        role,
        name: name.trim() || 'Kyber Athlete',
        email: email.trim(),
        dateOfBirth: dob || undefined,
        gender: gender || undefined,
        height: height ? parseFloat(height) : undefined,
        activityLevel: activity,
        fitnessGoal: goal || undefined,
        notes: notes || undefined,
      }

      if (role === 'trainer') {
        payload.businessName = businessName || undefined
        payload.bio = bio || undefined
        payload.specialization = specialization || undefined
        payload.yearsExperience = experience ? parseInt(experience) : undefined
      }

      await onboardUser({ data: payload })
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to complete onboarding. Please try again.')
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-container)]"></div>
        <p className="body-md text-[var(--on-surface-variant)] mt-4">Securing connection to portal...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="chip mb-4">PORTAL REGISTRATION</div>
      <h1 className="headline-lg font-black text-white mb-2">COMPLETE YOUR BIO PROFILE</h1>
      <p className="body-md text-[var(--on-surface-variant)] mb-8">
        Welcome to Kyber, {name}. Please configure your performance role and initial metrics to sync your biometric logs.
      </p>

      {error && (
        <div className="p-4 mb-6 rounded-md bg-red-950/40 border border-red-900 text-red-300 body-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Choice Card */}
        <div className="card grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole('individual')}
            className={`p-4 rounded-md text-left flex flex-col gap-2 transition-all ${
              role === 'individual'
                ? 'bg-white/[0.04] border border-[var(--primary-container)]'
                : 'bg-transparent border border-white/5 opacity-60 hover:opacity-100'
            }`}
          >
            <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl">fitness_center</span>
            <span className="font-bold text-white text-base">Individual Athlete</span>
            <span className="text-xs text-[var(--on-surface-variant)]">I want to log my personal workouts and track my health data.</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('trainer')}
            className={`p-4 rounded-md text-left flex flex-col gap-2 transition-all ${
              role === 'trainer'
                ? 'bg-white/[0.04] border border-[var(--secondary-container)]'
                : 'bg-transparent border border-white/5 opacity-60 hover:opacity-100'
            }`}
          >
            <span className="material-symbols-outlined text-[var(--secondary-container)] text-3xl">sports</span>
            <span className="font-bold text-white text-base">Professional Trainer</span>
            <span className="text-xs text-[var(--on-surface-variant)]">I want to manage client files, assign workouts, and track progress.</span>
          </button>
        </div>

        {/* Base Details Card */}
        <div className="card space-y-4">
          <h3 className="headline-md text-lg font-bold border-b border-white/5 pb-2">Base Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="label-md text-[var(--on-surface-variant)]">Full Name</label>
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
                className="input-field bg-white/[0.02] text-white/50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Conditional Cards */}
        {role === 'individual' ? (
          <div className="card space-y-4">
            <h3 className="headline-md text-lg font-bold border-b border-white/5 pb-2 text-[var(--primary-container)]">Athlete Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="input-field"
                />
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
                <label className="label-md text-[var(--on-surface-variant)]">Fitness Goal</label>
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
              <label className="label-md text-[var(--on-surface-variant)]">Medical/Injury Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any past injuries, limitations, or instructions for trainers..."
                className="input-field min-h-[80px]"
              />
            </div>
          </div>
        ) : (
          <div className="card space-y-4">
            <h3 className="headline-md text-lg font-bold border-b border-white/5 pb-2 text-[var(--secondary-container)]">Coaching Credentials</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">Business / Studio Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Kinetic Labs Studio"
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="label-md text-[var(--on-surface-variant)]">Years of Experience</label>
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
              <label className="label-md text-[var(--on-surface-variant)]">Specialization Areas</label>
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
                className="input-field min-h-[80px]"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`btn btn-primary w-full py-3 ${submitting ? 'btn-disabled' : ''}`}
        >
          {submitting ? 'Registering...' : 'Sync Portal & Continue'}
        </button>
      </form>
    </div>
  )
}
