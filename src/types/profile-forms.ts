import type { UserRole } from './domain'

export interface OnboardingPayload {
  role: UserRole
  name: string
  email: string
  dateOfBirth?: string
  gender?: string
  height?: number
  activityLevel?: string
  fitnessGoal?: string
  notes?: string
  businessName?: string
  bio?: string
  specialization?: string
  yearsExperience?: number
}

export interface UpdateUserProfilePayload extends Omit<OnboardingPayload, 'role' | 'email'> {}
