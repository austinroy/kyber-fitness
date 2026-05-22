import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. Users Table (Linked to Clerk via Clerk User ID)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Clerk User ID (e.g. 'user_2NGB...')
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // "individual" | "trainer"
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 2. Profiles Table (Shared details)
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  height: real('height'), // Height is stored on the profile
  activityLevel: text('activity_level'), // e.g. "sedentary" | "active"
  fitnessGoal: text('fitness_goal'),
  notes: text('notes'),
});

// 3. Trainer Profiles Table (Trainer-specific fields)
export const trainerProfiles = sqliteTable('trainer_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  businessName: text('business_name'),
  bio: text('bio'),
  specialization: text('specialization'),
  yearsExperience: integer('years_experience'),
});

// 4. Trainer-Client Relationships Table
export const trainerClients = sqliteTable('trainer_clients', {
  id: text('id').primaryKey(),
  trainerId: text('trainer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: text('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull(), // "pending" | "active" | "declined" | "removed"
  permissions: text('permissions').notNull(), // JSON string for canViewHealthData, canAddSessions, etc.
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 5. Workout Sessions Container
export const workoutSessions = sqliteTable('workout_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // Who the workout belongs to
  recordedByUserId: text('recorded_by_user_id').references(() => users.id).notNull(), // Who recorded it
  title: text('title').notNull(),
  sessionDate: text('session_date').notNull(),
  durationMinutes: integer('duration_minutes'),
  location: text('location'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 6. Exercises Library (Global & Custom)
export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // "strength" | "cardio" | "bodyweight" | "mobility"
  defaultUnit: text('default_unit'), // e.g. "kg" | "lbs" | "km" | "miles"
  createdByUserId: text('created_by_user_id').references(() => users.id),
  isGlobal: integer('is_global').default(0), // 1 = global default, 0 = custom
});

// 7. Session Exercises (Junction between Sessions & Exercises)
export const sessionExercises = sqliteTable('session_exercises', {
  id: text('id').primaryKey(),
  workoutSessionId: text('workout_session_id').references(() => workoutSessions.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: text('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  orderIndex: integer('order_index').notNull(),
  notes: text('notes'),
});

// 8. Exercise Sets
export const exerciseSets = sqliteTable('exercise_sets', {
  id: text('id').primaryKey(),
  sessionExerciseId: text('session_exercise_id').references(() => sessionExercises.id, { onDelete: 'cascade' }).notNull(),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weight: real('weight'),
  durationSeconds: integer('duration_seconds'),
  distance: real('distance'),
  restSeconds: integer('rest_seconds'),
  intensity: text('intensity'), // e.g. RPE or pace
  notes: text('notes'),
});

// 9. Health Metrics Table (For tracking metrics over time)
export const healthMetrics = sqliteTable('health_metrics', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  metricType: text('metric_type').notNull(), // "weight" | "body_fat" | "resting_hr"
  value: real('value').notNull(),
  unit: text('unit').notNull(),
  recordedAt: text('recorded_at').notNull(),
  recordedByUserId: text('recorded_by_user_id').references(() => users.id).notNull(),
  notes: text('notes'),
});

// 10. Workout Program Templates (Routines designed by trainers)
export const workoutPrograms = sqliteTable('workout_programs', {
  id: text('id').primaryKey(),
  createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // Trainer ID
  title: text('title').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 11. Program Exercises (Junction between Program & Exercises)
export const workoutProgramExercises = sqliteTable('workout_program_exercises', {
  id: text('id').primaryKey(),
  programId: text('program_id').references(() => workoutPrograms.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: text('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  orderIndex: integer('order_index').notNull(),
  notes: text('notes'),
});

// 12. Program Sets (Default reps / weights for program templates)
export const workoutProgramSets = sqliteTable('workout_program_sets', {
  id: text('id').primaryKey(),
  programExerciseId: text('program_exercise_id').references(() => workoutProgramExercises.id, { onDelete: 'cascade' }).notNull(),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weight: real('weight'),
  durationSeconds: integer('duration_seconds'),
  distance: real('distance'),
  restSeconds: integer('rest_seconds'),
  intensity: text('intensity'), // e.g., RPE/pace
  notes: text('notes'),
});

// 13. Program Direct Client Assignments
export const programAssignments = sqliteTable('program_assignments', {
  id: text('id').primaryKey(),
  programId: text('program_id').references(() => workoutPrograms.id, { onDelete: 'cascade' }).notNull(),
  clientId: text('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // Athlete client ID
  assignedByUserId: text('assigned_by_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // Trainer ID
  status: text('status').notNull(), // "pending" | "completed"
  notes: text('notes'), // Custom instructions from trainer to client
  assignedAt: text('assigned_at').notNull(),
  completedAt: text('completed_at'),
});

