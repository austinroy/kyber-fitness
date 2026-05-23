import { db } from './index'
import { exercises } from './schema'
import { sql } from 'drizzle-orm'

const globalExercises = [
  { id: 'ex-1', name: 'Barbell Back Squat', category: 'strength', defaultUnit: 'kg', isGlobal: 1 },
  { id: 'ex-2', name: 'Barbell Bench Press', category: 'strength', defaultUnit: 'kg', isGlobal: 1 },
  { id: 'ex-3', name: 'Barbell Deadlift', category: 'strength', defaultUnit: 'kg', isGlobal: 1 },
  {
    id: 'ex-4',
    name: 'Overhead Shoulder Press',
    category: 'strength',
    defaultUnit: 'kg',
    isGlobal: 1,
  },
  { id: 'ex-5', name: 'Barbell Row', category: 'strength', defaultUnit: 'kg', isGlobal: 1 },
  { id: 'ex-6', name: 'Pull-up', category: 'bodyweight', defaultUnit: 'reps', isGlobal: 1 },
  { id: 'ex-7', name: 'Push-up', category: 'bodyweight', defaultUnit: 'reps', isGlobal: 1 },
  { id: 'ex-8', name: 'Dumbbell Bicep Curl', category: 'strength', defaultUnit: 'kg', isGlobal: 1 },
  {
    id: 'ex-9',
    name: 'Tricep Rope Pushdown',
    category: 'strength',
    defaultUnit: 'kg',
    isGlobal: 1,
  },
  { id: 'ex-10', name: 'Outdoor Running', category: 'cardio', defaultUnit: 'km', isGlobal: 1 },
  { id: 'ex-11', name: 'Stationary Cycling', category: 'cardio', defaultUnit: 'km', isGlobal: 1 },
  { id: 'ex-12', name: 'Lap Swimming', category: 'cardio', defaultUnit: 'm', isGlobal: 1 },
  { id: 'ex-13', name: 'Plank', category: 'bodyweight', defaultUnit: 'seconds', isGlobal: 1 },
  { id: 'ex-14', name: 'Vinyasa Yoga', category: 'mobility', defaultUnit: 'minutes', isGlobal: 1 },
  {
    id: 'ex-15',
    name: 'Hamstring Stretch',
    category: 'mobility',
    defaultUnit: 'seconds',
    isGlobal: 1,
  },
]

async function seed() {
  console.log('Seeding exercises...')
  try {
    for (const ex of globalExercises) {
      // Insert or ignore if it already exists
      await db.insert(exercises).values(ex).onConflictDoNothing()
    }
    console.log('Seed completed successfully!')
  } catch (error) {
    console.error('Seed failed:', error)
  }
}

seed()
