import { completeWorkout, type CompleteWorkoutExerciseInput, type RecoveryMetrics } from "@/services/fitness-service";
import { getDb } from "@/services/database";
import { enqueue, flushQueue } from "@/services/sync-service";

type CompleteWorkoutInput = {
  userId: string;
  workoutId: string;
  difficulty: number;
  exercises: CompleteWorkoutExerciseInput[];
  recovery?: RecoveryMetrics;
};

function localId(): string {
  return "local-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

// Saves workout completion to SQLite immediately, then queues API sync.
// Falls back to direct API call if the local DB is unavailable.
export async function completeWorkoutOfflineFirst(input: CompleteWorkoutInput): Promise<void> {
  try {
    await saveLocally(input);

    const apiPayload = {
      workoutId: input.workoutId,
      difficulty: input.difficulty,
      exercises: input.exercises,
      ...(input.recovery ? { recovery: input.recovery } : {}),
    };

    await enqueue("complete_workout", apiPayload);

    // Non-blocking: try to push right away if online.
    void flushAndMarkSynced(input.workoutId, input.userId);
  } catch {
    // SQLite unavailable — fall back to direct API call.
    await completeWorkout(input);
  }
}

async function saveLocally(input: CompleteWorkoutInput): Promise<void> {
  const db = await getDb();
  const logId = localId();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO workout_logs
       (id, user_id, workout_id, difficulty, sleep_hours, sleep_quality, stress_level, completed_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      logId,
      input.userId,
      input.workoutId,
      input.difficulty,
      input.recovery?.sleepHours ?? null,
      input.recovery?.sleepQuality ?? null,
      input.recovery?.stressLevel ?? null,
      now,
    ]
  );

  for (const exercise of input.exercises) {
    const exerciseLogId = localId();
    await db.runAsync(
      `INSERT INTO exercise_logs (id, workout_log_id, exercise_id, rpe, form_quality, cycle)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exerciseLogId, logId, exercise.exercise_id, null, null, null]
    );

    for (const set of exercise.sets) {
      await db.runAsync(
        `INSERT INTO set_logs (id, exercise_log_id, reps, weight, rpe)
         VALUES (?, ?, ?, ?, ?)`,
        [localId(), exerciseLogId, set.reps, set.weight, set.rpe ?? null]
      );
    }
  }
}

async function flushAndMarkSynced(workoutId: string, userId: string): Promise<void> {
  const { synced } = await flushQueue();
  if (synced > 0) {
    const db = await getDb();
    await db.runAsync(
      "UPDATE workout_logs SET synced = 1 WHERE workout_id = ? AND user_id = ? AND synced = 0",
      [workoutId, userId]
    );
  }
}
