import type { ExerciseCategory } from './domain'

export interface SetInput {
  setNumber: number
  reps: string
  weight: string
  durationSeconds: string
  distance: string
  restSeconds: string
  intensity: string
  notes: string
}

export interface ExerciseInput {
  exerciseId: string
  name: string
  category: ExerciseCategory
  defaultUnit: string
  notes: string
  orderIndex: number
  sets: SetInput[]
}

export type MoveDirection = 'up' | 'down'

export interface SaveExerciseSetPayload {
  setNumber: number
  reps?: number
  weight?: number
  durationSeconds?: number
  distance?: number
  restSeconds?: number
  intensity?: string
  notes?: string
}

export interface SaveExercisePayload {
  exerciseId: string
  notes?: string
  orderIndex: number
  sets: SaveExerciseSetPayload[]
}

export interface SaveWorkoutSessionPayload {
  title: string
  sessionDate: string
  durationMinutes?: number
  location?: string
  notes?: string
  clientId?: string
  assignmentId?: string
  exercises: SaveExercisePayload[]
}

export interface SaveWorkoutProgramPayload {
  programId?: string
  title: string
  notes?: string
  exercises: SaveExercisePayload[]
}
