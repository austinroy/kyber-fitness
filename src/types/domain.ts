export type UserRole = 'individual' | 'trainer'

export type ExerciseCategory = 'strength' | 'cardio' | 'bodyweight' | 'mobility' | string

export type MetricType = 'weight' | 'body_fat' | 'resting_hr'

export interface UserRecord {
  id: string
  email: string
  name: string
  role: UserRole | string
  createdAt?: string
  updatedAt?: string
}

export interface UserSummary {
  id: string
  email: string
  name: string
}

export interface ProfileRecord {
  dateOfBirth?: string | null
  gender?: string | null
  height?: number | null
  activityLevel?: string | null
  fitnessGoal?: string | null
  notes?: string | null
}

export interface TrainerProfileRecord {
  businessName?: string | null
  bio?: string | null
  specialization?: string | null
  yearsExperience?: number | null
}

export interface ExerciseRecord {
  id: string
  name: string
  category: ExerciseCategory
  defaultUnit?: string | null
  createdByUserId?: string | null
  isGlobal?: number | null
}

export interface ExerciseSetRecord {
  id?: string
  setNumber: number
  reps?: number | null
  weight?: number | null
  durationSeconds?: number | null
  distance?: number | null
  restSeconds?: number | null
  intensity?: string | null
  notes?: string | null
}

export interface WorkoutExerciseRecord {
  id: string
  exerciseId: string
  name: string
  category: ExerciseCategory
  defaultUnit?: string | null
  orderIndex: number
  notes?: string | null
  sets: ExerciseSetRecord[]
}

export interface WorkoutSessionRecord {
  id: string
  userId: string
  recordedByUserId: string
  title: string
  sessionDate: string
  durationMinutes?: number | null
  location?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
  recordedByName?: string
  exercises: WorkoutExerciseRecord[]
}

export interface HealthMetricRecord {
  id: string
  userId: string
  metricType: MetricType | string
  value: number
  unit: string
  recordedAt: string
  recordedByUserId: string
  notes?: string | null
}

export interface TrainerClientRecord {
  id: string
  status: 'pending' | 'active' | 'declined' | 'removed' | string
  permissions?: string
  createdAt: string
  client: UserSummary
  profile: ProfileRecord
}

export interface TrainerRelationshipRecord {
  id: string
  status: 'pending' | 'active' | 'declined' | 'removed' | string
  permissions?: string
  createdAt: string
  trainer: UserSummary
  trainerProfile: TrainerProfileRecord
}

export interface WorkoutProgramSummary {
  id: string
  createdByUserId: string
  title: string
  notes?: string | null
  createdAt: string
  updatedAt: string
  exerciseCount: number
  assignmentCount: number
}

export interface WorkoutProgramDetails extends Omit<
  WorkoutProgramSummary,
  'exerciseCount' | 'assignmentCount'
> {
  exercises: WorkoutExerciseRecord[]
}

export interface ProgramAssignmentRecord {
  id: string
  status: 'pending' | 'completed' | string
  notes?: string | null
  assignedAt: string
  completedAt?: string | null
  programId: string
  programTitle?: string
  programNotes?: string | null
  trainerName: string
}

export interface AssignedWorkoutProgramDetails {
  assignment: ProgramAssignmentRecord
  program: WorkoutProgramDetails
}

export interface CurrentUserProfile {
  authenticated: boolean
  onboarded: boolean
  userId?: string
  user?: UserRecord
  profile?: ProfileRecord | null
  trainerProfile?: TrainerProfileRecord | null
}

export interface CoachingNoteRecord {
  id: string
  trainerId: string
  clientId: string
  title: string
  body: string
  pinned: number
  createdAt: string
  updatedAt: string
}

export interface NotificationRecord {
  id: string
  userId: string
  type: string
  title: string
  body: string
  actionUrl?: string | null
  readAt?: string | null
  createdAt: string
}
