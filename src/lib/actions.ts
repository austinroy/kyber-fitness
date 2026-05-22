import { createServerFn } from '@tanstack/react-start';
import { db } from './db';
import { users, profiles, trainerProfiles, trainerClients, workoutSessions, exercises, sessionExercises, exerciseSets, healthMetrics, workoutPrograms, workoutProgramExercises, workoutProgramSets, programAssignments } from './db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { getAuthUser, requireAuthUser } from './auth-server';

// Generate a random string ID helper
function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// 1. Get Current User Profile and DB Sync Status
export const getCurrentUserProfile = createServerFn({ method: 'GET' })
  .handler(async () => {
    const auth = await getAuthUser();
    if (!auth || !auth.userId) {
      return { authenticated: false, onboarded: false };
    }

    const userId = auth.userId;
    
    // Check if the user exists in our SQLite database
    const dbUsers = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (dbUsers.length === 0) {
      return { authenticated: true, onboarded: false, userId };
    }

    const user = dbUsers[0];
    
    // Fetch profile
    const dbProfiles = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    const profile = dbProfiles[0] || null;

    // Fetch trainer profile if they are a trainer
    let trainerProfile = null;
    if (user.role === 'trainer') {
      const dbTrainerProfiles = await db.select().from(trainerProfiles).where(eq(trainerProfiles.userId, userId)).limit(1);
      trainerProfile = dbTrainerProfiles[0] || null;
    }

    return {
      authenticated: true,
      onboarded: true,
      user,
      profile,
      trainerProfile,
    };
  });

// 2. Onboard User (Select role and set initial parameters)
export const onboardUser = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    role: 'individual' | 'trainer';
    name: string;
    email: string;
    // Shared profile details
    dateOfBirth?: string;
    gender?: string;
    height?: number;
    activityLevel?: string;
    fitnessGoal?: string;
    notes?: string;
    // Trainer profile details
    businessName?: string;
    bio?: string;
    specialization?: string;
    yearsExperience?: number;
  }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const userId = auth.userId;
    const now = new Date().toISOString();

    // 1. Create base user record
    await db.insert(users).values({
      id: userId,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();

    // 2. Create base profiles record (shared by both individuals and trainers)
    const profileId = generateId('prof');
    await db.insert(profiles).values({
      id: profileId,
      userId: userId,
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
      height: data.height || null,
      activityLevel: data.activityLevel || null,
      fitnessGoal: data.fitnessGoal || null,
      notes: data.notes || null,
    }).onConflictDoNothing();

    // 3. If trainer, create trainer profile record
    if (data.role === 'trainer') {
      const trainerProfId = generateId('tprof');
      await db.insert(trainerProfiles).values({
        id: trainerProfId,
        userId: userId,
        businessName: data.businessName || null,
        bio: data.bio || null,
        specialization: data.specialization || null,
        yearsExperience: data.yearsExperience || null,
      }).onConflictDoNothing();
    }

    return { success: true };
  });

// 2b. Update User Profile & Health Data / Credentials
export const updateUserProfile = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    name: string;
    // Shared profile details
    dateOfBirth?: string;
    gender?: string;
    height?: number;
    activityLevel?: string;
    fitnessGoal?: string;
    notes?: string;
    // Trainer profile details
    businessName?: string;
    bio?: string;
    specialization?: string;
    yearsExperience?: number;
  }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const userId = auth.userId;
    const now = new Date().toISOString();

    // 1. Get current user to check their role
    const dbUsers = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (dbUsers.length === 0) {
      throw new Error('User record not found in the database. Please complete onboarding first.');
    }
    const user = dbUsers[0];

    // 2. Perform updates inside a transaction
    db.transaction((tx) => {
      // Update name and updatedAt on the users table
      tx.update(users)
        .set({
          name: data.name,
          updatedAt: now
        })
        .where(eq(users.id, userId))
        .run();

      if (user.role === 'individual') {
        // Update profiles table
        tx.update(profiles)
          .set({
            dateOfBirth: data.dateOfBirth || null,
            gender: data.gender || null,
            height: data.height || null,
            activityLevel: data.activityLevel || null,
            fitnessGoal: data.fitnessGoal || null,
            notes: data.notes || null,
          })
          .where(eq(profiles.userId, userId))
          .run();
      } else if (user.role === 'trainer') {
        // Update trainerProfiles table
        tx.update(trainerProfiles)
          .set({
            businessName: data.businessName || null,
            bio: data.bio || null,
            specialization: data.specialization || null,
            yearsExperience: data.yearsExperience || null,
          })
          .where(eq(trainerProfiles.userId, userId))
          .run();
      }
    });

    return { success: true };
  });

// 3. Get Exercises (Global defaults + custom ones for the user)
export const getExercisesList = createServerFn({ method: 'GET' })
  .handler(async () => {
    const auth = await requireAuthUser();
    const userId = auth.userId;

    const list = await db.select().from(exercises).where(
      or(
        eq(exercises.isGlobal, 1),
        eq(exercises.createdByUserId, userId)
      )
    );
    return list;
  });

// 4. Create Custom Exercise
export const createCustomExercise = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string; category: string; defaultUnit: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const userId = auth.userId;

    const id = generateId('ex');
    await db.insert(exercises).values({
      id,
      name: data.name,
      category: data.category,
      defaultUnit: data.defaultUnit,
      createdByUserId: userId,
      isGlobal: 0,
    });

    return { success: true, exerciseId: id };
  });

// Helper: Check if a trainer is permitted to act on behalf of a client
async function verifyTrainerClientAccess(trainerId: string, clientId: string) {
  const rel = await db.select().from(trainerClients).where(
    and(
      eq(trainerClients.trainerId, trainerId),
      eq(trainerClients.clientId, clientId),
      eq(trainerClients.status, 'active')
    )
  ).limit(1);
  return rel.length > 0;
}

async function getProgramDetailsById(programId: string) {
  const progs = await db.select().from(workoutPrograms).where(eq(workoutPrograms.id, programId)).limit(1);
  if (progs.length === 0) {
    throw new Error('Program template not found.');
  }
  const program = progs[0];

  const exercisesList = await db.select({
    id: workoutProgramExercises.id,
    orderIndex: workoutProgramExercises.orderIndex,
    notes: workoutProgramExercises.notes,
    exerciseId: exercises.id,
    name: exercises.name,
    category: exercises.category,
    defaultUnit: exercises.defaultUnit,
  })
  .from(workoutProgramExercises)
  .innerJoin(exercises, eq(workoutProgramExercises.exerciseId, exercises.id))
  .where(eq(workoutProgramExercises.programId, programId))
  .orderBy(workoutProgramExercises.orderIndex);

  const fullExercises = [];
  for (const ex of exercisesList) {
    const sets = await db.select().from(workoutProgramSets)
      .where(eq(workoutProgramSets.programExerciseId, ex.id))
      .orderBy(workoutProgramSets.setNumber);

    fullExercises.push({
      ...ex,
      sets,
    });
  }

  return {
    ...program,
    exercises: fullExercises,
  };
}

// 5. Save Workout Session
export const saveWorkoutSession = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    title: string;
    sessionDate: string;
    durationMinutes?: number;
    location?: string;
    notes?: string;
    clientId?: string; // Optional client log by trainer
    assignmentId?: string; // Optional program assignment completed
    exercises: Array<{
      exerciseId: string;
      notes?: string;
      orderIndex: number;
      sets: Array<{
        setNumber: number;
        reps?: number;
        weight?: number;
        durationSeconds?: number;
        distance?: number;
        restSeconds?: number;
        intensity?: string;
        notes?: string;
      }>;
    }>;
  }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const currentUserId = auth.userId;
    const now = new Date().toISOString();

    let targetUserId = currentUserId;
    let assignment = null;

    // If logging for a client, verify active connection
    if (data.clientId) {
      if (data.assignmentId) {
        throw new Error('Coach-entered client sessions cannot complete athlete program assignments.');
      }
      const isPermitted = await verifyTrainerClientAccess(currentUserId, data.clientId);
      if (!isPermitted) {
        throw new Error('Trainer does not have an active partnership with this client.');
      }
      targetUserId = data.clientId;
    }

    if (data.assignmentId) {
      const assignments = await db.select().from(programAssignments).where(
        and(
          eq(programAssignments.id, data.assignmentId),
          eq(programAssignments.clientId, currentUserId),
          eq(programAssignments.status, 'pending')
        )
      ).limit(1);

      if (assignments.length === 0) {
        throw new Error('Program assignment not found, already completed, or not assigned to this athlete.');
      }

      assignment = assignments[0];
    }

    const sessionId = generateId('sess');

    // Run within a transaction to maintain integrity
    db.transaction((tx) => {
      // 1. Insert Workout Session
      tx.insert(workoutSessions).values({
        id: sessionId,
        userId: targetUserId,
        recordedByUserId: currentUserId,
        title: data.title,
        sessionDate: data.sessionDate,
        durationMinutes: data.durationMinutes || null,
        location: data.location || null,
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
      }).run();

      // 2. Insert Exercises and their Sets
      for (const ex of data.exercises) {
        const sessExId = generateId('sexex');
        tx.insert(sessionExercises).values({
          id: sessExId,
          workoutSessionId: sessionId,
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex,
          notes: ex.notes || null,
        }).run();

        for (const set of ex.sets) {
          const setId = generateId('set');
          tx.insert(exerciseSets).values({
            id: setId,
            sessionExerciseId: sessExId,
            setNumber: set.setNumber,
            reps: set.reps || null,
            weight: set.weight || null,
            durationSeconds: set.durationSeconds || null,
            distance: set.distance || null,
            restSeconds: set.restSeconds || null,
            intensity: set.intensity || null,
            notes: set.notes || null,
          }).run();
        }
      }

      // 3. Mark program assignment as completed if assignmentId is present
      if (assignment) {
        tx.update(programAssignments)
          .set({ status: 'completed', completedAt: now })
          .where(
            and(
              eq(programAssignments.id, assignment.id),
              eq(programAssignments.clientId, currentUserId),
              eq(programAssignments.status, 'pending')
            )
          )
          .run();
      }
    });

    return { success: true, sessionId };
  });

// 6. Get Workout Sessions History
export const getWorkoutSessionsHistory = createServerFn({ method: 'GET' })
  .inputValidator((data?: { clientId?: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const currentUserId = auth.userId;

    let targetUserId = currentUserId;

    // Verify trainer authorization if client ID is provided
    if (data?.clientId) {
      const isPermitted = await verifyTrainerClientAccess(currentUserId, data.clientId);
      if (!isPermitted) {
        throw new Error('Unauthorized client data access');
      }
      targetUserId = data.clientId;
    }

    // Fetch sessions
    const sessions = await db.select().from(workoutSessions)
      .where(eq(workoutSessions.userId, targetUserId))
      .orderBy(desc(workoutSessions.sessionDate));

    const fullHistory = [];

    for (const sess of sessions) {
      // Fetch associated exercises
      const sessExs = await db.select({
        id: sessionExercises.id,
        orderIndex: sessionExercises.orderIndex,
        notes: sessionExercises.notes,
        exerciseId: exercises.id,
        name: exercises.name,
        category: exercises.category,
        defaultUnit: exercises.defaultUnit,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.workoutSessionId, sess.id))
      .orderBy(sessionExercises.orderIndex);

      const exercisesWithSets = [];

      for (const ex of sessExs) {
        // Fetch sets
        const sets = await db.select().from(exerciseSets)
          .where(eq(exerciseSets.sessionExerciseId, ex.id))
          .orderBy(exerciseSets.setNumber);

        exercisesWithSets.push({
          ...ex,
          sets,
        });
      }

      // Fetch recorder profile details
      let recorderName = 'Self';
      if (sess.recordedByUserId !== sess.userId) {
        const recorder = await db.select().from(users).where(eq(users.id, sess.recordedByUserId)).limit(1);
        if (recorder.length > 0) {
          recorderName = recorder[0].name;
        }
      }

      fullHistory.push({
        ...sess,
        exercises: exercisesWithSets,
        recordedByName: recorderName,
      });
    }

    return fullHistory;
  });

// 7. Get Trainer's Clients
export const getTrainerClientsList = createServerFn({ method: 'GET' })
  .handler(async () => {
    const auth = await requireAuthUser();
    const trainerId = auth.userId;

    const relationships = await db.select({
      id: trainerClients.id,
      status: trainerClients.status,
      permissions: trainerClients.permissions,
      createdAt: trainerClients.createdAt,
      client: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      profile: {
        dateOfBirth: profiles.dateOfBirth,
        gender: profiles.gender,
        height: profiles.height,
        activityLevel: profiles.activityLevel,
        fitnessGoal: profiles.fitnessGoal,
        notes: profiles.notes,
      }
    })
    .from(trainerClients)
    .innerJoin(users, eq(trainerClients.clientId, users.id))
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(trainerClients.trainerId, trainerId));

    return relationships;
  });

// 8. Invite Client via Email (Flow A: Trainer invites client by email)
export const inviteClientByEmail = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const trainerId = auth.userId;
    const now = new Date().toISOString();

    // 1. Find user by email
    const cleanEmail = data.email.trim().toLowerCase();
    const dbUsers = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

    if (dbUsers.length === 0) {
      throw new Error(`No Kyber Fitness account exists with email "${cleanEmail}". Let your client sign up first!`);
    }

    const clientUser = dbUsers[0];
    if (clientUser.role !== 'individual') {
      throw new Error('You can only invite users registered as Individuals, not Trainers.');
    }

    // 2. Check if a relationship already exists
    const existing = await db.select().from(trainerClients).where(
      and(
        eq(trainerClients.trainerId, trainerId),
        eq(trainerClients.clientId, clientUser.id)
      )
    ).limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      if (current.status === 'active') {
        throw new Error('This user is already an active client!');
      } else if (current.status === 'pending') {
        throw new Error('A pending invite is already awaiting their approval.');
      } else {
        // Reactivate connection request
        await db.update(trainerClients)
          .set({ status: 'pending', updatedAt: now })
          .where(eq(trainerClients.id, current.id));
        return { success: true, message: 'Invite request re-sent!' };
      }
    }

    // 3. Create trainer-client link
    const linkId = generateId('tcl');
    await db.insert(trainerClients).values({
      id: linkId,
      trainerId,
      clientId: clientUser.id,
      status: 'pending',
      permissions: JSON.stringify({ canViewHealthData: true, canAddSessions: true }),
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, message: 'Invitation sent successfully! Awaiting individual approval.' };
  });

// 9. Get Individual's Trainers (All connected trainers & requests)
export const getIndividualTrainersList = createServerFn({ method: 'GET' })
  .handler(async () => {
    const auth = await requireAuthUser();
    const clientId = auth.userId;

    const relationships = await db.select({
      id: trainerClients.id,
      status: trainerClients.status,
      permissions: trainerClients.permissions,
      createdAt: trainerClients.createdAt,
      trainer: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      trainerProfile: {
        businessName: trainerProfiles.businessName,
        bio: trainerProfiles.bio,
        specialization: trainerProfiles.specialization,
        yearsExperience: trainerProfiles.yearsExperience,
      }
    })
    .from(trainerClients)
    .innerJoin(users, eq(trainerClients.trainerId, users.id))
    .innerJoin(trainerProfiles, eq(trainerProfiles.userId, users.id))
    .where(eq(trainerClients.clientId, clientId));

    return relationships;
  });

// 10. Respond to Trainer Invitation Request
export const respondToTrainerInvitation = createServerFn({ method: 'POST' })
  .inputValidator((data: { relationshipId: string; accept: boolean }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const clientId = auth.userId;
    const now = new Date().toISOString();

    const relationships = await db.select().from(trainerClients).where(
      and(
        eq(trainerClients.id, data.relationshipId),
        eq(trainerClients.clientId, clientId)
      )
    ).limit(1);

    if (relationships.length === 0) {
      throw new Error('Invitation request not found.');
    }

    const rel = relationships[0];
    const status = data.accept ? 'active' : 'declined';

    await db.update(trainerClients)
      .set({ status, updatedAt: now })
      .where(eq(trainerClients.id, rel.id));

    return { success: true, status };
  });

// 11. Log Health Metric
export const logHealthMetric = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    metricType: 'weight' | 'body_fat' | 'resting_hr';
    value: number;
    unit: string;
    notes?: string;
    clientId?: string; // Optional client log by trainer
  }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const currentUserId = auth.userId;
    const now = new Date().toISOString();

    let targetUserId = currentUserId;

    if (data.clientId) {
      const isPermitted = await verifyTrainerClientAccess(currentUserId, data.clientId);
      if (!isPermitted) {
        throw new Error('Trainer does not have permission to log health metrics for this client.');
      }
      targetUserId = data.clientId;
    }

    const metricId = generateId('met');
    await db.insert(healthMetrics).values({
      id: metricId,
      userId: targetUserId,
      metricType: data.metricType,
      value: data.value,
      unit: data.unit,
      recordedAt: now,
      recordedByUserId: currentUserId,
      notes: data.notes || null,
    });

    return { success: true, metricId };
  });

// 12. Get Health Metrics History (e.g. body weight)
export const getHealthMetricsHistory = createServerFn({ method: 'GET' })
  .inputValidator((data?: { clientId?: string; metricType?: 'weight' | 'body_fat' | 'resting_hr' }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const currentUserId = auth.userId;

    let targetUserId = currentUserId;

    if (data?.clientId) {
      const isPermitted = await verifyTrainerClientAccess(currentUserId, data.clientId);
      if (!isPermitted) {
        throw new Error('Unauthorized access to client metrics');
      }
      targetUserId = data.clientId;
    }

    const type = data?.metricType || 'weight';

    const list = await db.select().from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, targetUserId),
          eq(healthMetrics.metricType, type)
        )
      )
      .orderBy(desc(healthMetrics.recordedAt));

    return list;
  });

// 13. Get Workout Programs created by Trainer
export const getWorkoutPrograms = createServerFn({ method: 'GET' })
  .handler(async () => {
    const auth = await requireAuthUser();
    const trainerId = auth.userId;

    const list = await db.select().from(workoutPrograms)
      .where(eq(workoutPrograms.createdByUserId, trainerId))
      .orderBy(desc(workoutPrograms.createdAt));

    const enrichedList = [];
    for (const prog of list) {
      // Get number of exercises in the template
      const countRes = await db.select({ count: sql<number>`count(*)` })
        .from(workoutProgramExercises)
        .where(eq(workoutProgramExercises.programId, prog.id));
      
      // Get assignment count
      const assignCount = await db.select({ count: sql<number>`count(*)` })
        .from(programAssignments)
        .where(eq(programAssignments.programId, prog.id));

      enrichedList.push({
        ...prog,
        exerciseCount: countRes[0]?.count || 0,
        assignmentCount: assignCount[0]?.count || 0,
      });
    }

    return enrichedList;
  });

// 14. Get Program details (exercises + sets)
export const getWorkoutProgramDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { programId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const userId = auth.userId;

    const progs = await db.select().from(workoutPrograms)
      .where(eq(workoutPrograms.id, data.programId))
      .limit(1);
    if (progs.length === 0) {
      throw new Error('Program template not found.');
    }
    const program = progs[0];

    if (program.createdByUserId !== userId) {
      const assignmentAccess = await db.select().from(programAssignments).where(
        and(
          eq(programAssignments.programId, data.programId),
          eq(programAssignments.clientId, userId)
        )
      ).limit(1);

      if (assignmentAccess.length === 0) {
        throw new Error('Unauthorized program access.');
      }
    }

    return getProgramDetailsById(data.programId);
  });

// 14b. Get assigned program details for the current athlete
export const getAssignedWorkoutProgramDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { assignmentId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const clientId = auth.userId;

    const assignments = await db.select({
      id: programAssignments.id,
      status: programAssignments.status,
      notes: programAssignments.notes,
      assignedAt: programAssignments.assignedAt,
      completedAt: programAssignments.completedAt,
      programId: programAssignments.programId,
      trainerName: users.name,
    })
    .from(programAssignments)
    .innerJoin(users, eq(programAssignments.assignedByUserId, users.id))
    .where(
      and(
        eq(programAssignments.id, data.assignmentId),
        eq(programAssignments.clientId, clientId),
        eq(programAssignments.status, 'pending')
      )
    )
    .limit(1);

    if (assignments.length === 0) {
      throw new Error('Program assignment not found, already completed, or not assigned to this athlete.');
    }

    const assignment = assignments[0];
    const program = await getProgramDetailsById(assignment.programId);

    return {
      assignment,
      program,
    };
  });

// 15. Create or Edit a Workout Program Template
export const saveWorkoutProgram = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    programId?: string; // If editing
    title: string;
    notes?: string;
    exercises: Array<{
      exerciseId: string;
      notes?: string;
      orderIndex: number;
      sets: Array<{
        setNumber: number;
        reps?: number;
        weight?: number;
        durationSeconds?: number;
        distance?: number;
        restSeconds?: number;
        intensity?: string;
        notes?: string;
      }>;
    }>;
  }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const trainerId = auth.userId;
    const now = new Date().toISOString();

    const isEdit = !!data.programId;
    const programId = data.programId || generateId('prog');

    if (isEdit) {
      const existing = await db.select().from(workoutPrograms).where(
        and(
          eq(workoutPrograms.id, programId),
          eq(workoutPrograms.createdByUserId, trainerId)
        )
      ).limit(1);

      if (existing.length === 0) {
        throw new Error('Unauthorized or program not found.');
      }
    }

    db.transaction((tx) => {
      if (isEdit) {
        // 1. Update program header
        tx.update(workoutPrograms)
          .set({
            title: data.title,
            notes: data.notes || null,
            updatedAt: now,
          })
          .where(
            and(
              eq(workoutPrograms.id, programId),
              eq(workoutPrograms.createdByUserId, trainerId)
            )
          )
          .run();

        // 2. Delete existing exercises and sets
        const oldExs = tx.select().from(workoutProgramExercises).where(eq(workoutProgramExercises.programId, programId)).all();
        for (const ex of oldExs) {
          tx.delete(workoutProgramSets).where(eq(workoutProgramSets.programExerciseId, ex.id)).run();
        }
        tx.delete(workoutProgramExercises).where(eq(workoutProgramExercises.programId, programId)).run();
      } else {
        // Create program header
        tx.insert(workoutPrograms).values({
          id: programId,
          createdByUserId: trainerId,
          title: data.title,
          notes: data.notes || null,
          createdAt: now,
          updatedAt: now,
        }).run();
      }

      // 3. Insert new exercises and sets
      for (const ex of data.exercises) {
        const progExId = generateId('progex');
        tx.insert(workoutProgramExercises).values({
          id: progExId,
          programId: programId,
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex,
          notes: ex.notes || null,
        }).run();

        for (const set of ex.sets) {
          const setId = generateId('progset');
          tx.insert(workoutProgramSets).values({
            id: setId,
            programExerciseId: progExId,
            setNumber: set.setNumber,
            reps: set.reps || null,
            weight: set.weight || null,
            durationSeconds: set.durationSeconds || null,
            distance: set.distance || null,
            restSeconds: set.restSeconds || null,
            intensity: set.intensity || null,
            notes: set.notes || null,
          }).run();
        }
      }
    });

    return { success: true, programId };
  });

// 16. Delete Workout Program Template
export const deleteWorkoutProgram = createServerFn({ method: 'POST' })
  .inputValidator((data: { programId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const trainerId = auth.userId;

    // Verify program belongs to trainer
    const progs = await db.select().from(workoutPrograms)
      .where(
        and(
          eq(workoutPrograms.id, data.programId),
          eq(workoutPrograms.createdByUserId, trainerId)
        )
      ).limit(1);

    if (progs.length === 0) {
      throw new Error('Unauthorized or program not found.');
    }

    db.transaction((tx) => {
      tx.delete(workoutPrograms).where(eq(workoutPrograms.id, data.programId)).run();
    });

    return { success: true };
  });

// 17. Direct Assignment of Program to Client
export const assignProgramToClient = createServerFn({ method: 'POST' })
  .inputValidator((data: { programId: string; clientId: string; notes?: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const trainerId = auth.userId;
    const now = new Date().toISOString();

    // 1. Verify trainer-client partnership
    const isPermitted = await verifyTrainerClientAccess(trainerId, data.clientId);
    if (!isPermitted) {
      throw new Error('Trainer does not have an active partnership with this client.');
    }

    // 2. Verify program belongs to trainer
    const progs = await db.select().from(workoutPrograms)
      .where(
        and(
          eq(workoutPrograms.id, data.programId),
          eq(workoutPrograms.createdByUserId, trainerId)
        )
      ).limit(1);

    if (progs.length === 0) {
      throw new Error('Program template not found or unauthorized.');
    }

    // 3. Assign
    const assignmentId = generateId('asgn');
    await db.insert(programAssignments).values({
      id: assignmentId,
      programId: data.programId,
      clientId: data.clientId,
      assignedByUserId: trainerId,
      status: 'pending',
      notes: data.notes || null,
      assignedAt: now,
    });

    return { success: true, assignmentId };
  });

// 18. Get Athlete Client's Assigned Programs
export const getClientAssignedPrograms = createServerFn({ method: 'GET' })
  .inputValidator((data?: { status?: 'pending' | 'completed' }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuthUser();
    const clientId = auth.userId;

    const queryStatus = data?.status || 'pending';

    // Query assignments join users (trainer details) join programs
    const list = await db.select({
      id: programAssignments.id,
      status: programAssignments.status,
      notes: programAssignments.notes,
      assignedAt: programAssignments.assignedAt,
      completedAt: programAssignments.completedAt,
      programId: workoutPrograms.id,
      programTitle: workoutPrograms.title,
      programNotes: workoutPrograms.notes,
      trainerName: users.name,
    })
    .from(programAssignments)
    .innerJoin(workoutPrograms, eq(programAssignments.programId, workoutPrograms.id))
    .innerJoin(users, eq(programAssignments.assignedByUserId, users.id))
    .where(
      and(
        eq(programAssignments.clientId, clientId),
        eq(programAssignments.status, queryStatus)
      )
    )
    .orderBy(desc(programAssignments.assignedAt));

    return list;
  });
