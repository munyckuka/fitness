import { getDb } from "@/services/database";
import { getUserWorkouts, type WorkoutSummary, type WorkoutExercise } from "@/services/fitness-service";
import { cacheExercises } from "@/services/exercise-cache";

type WorkoutRow = {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  equipment_json: string;
  level: string;
  duration_minutes: number;
  cached_at: number;
};

type ExerciseRow = {
  id: string;
  workout_id: string;
  exercise_id: string | null;
  name: string;
  muscle_group: string | null;
  required_equipment: string | null;
  difficulty_level: string | null;
  sets: number;
  reps: number;
  rest: number;
  weight: number | null;
  cycle: number;
  position: number;
};

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getCachedWorkouts(userId: string): Promise<WorkoutSummary[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkoutRow>(
      "SELECT * FROM workouts WHERE user_id = ? ORDER BY cached_at DESC",
      [userId]
    );

    const result: WorkoutSummary[] = [];
    for (const row of rows) {
      const exercises = await db.getAllAsync<ExerciseRow>(
        "SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY position ASC",
        [row.id]
      );
      result.push(rowToWorkout(row, exercises));
    }
    return result;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function cacheWorkouts(userId: string, workouts: WorkoutSummary[]): Promise<void> {
  try {
    const db = await getDb();
    const now = Date.now();

    // Clear stale cache for this user before re-inserting.
    await db.runAsync(
      "DELETE FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = ?)",
      [userId]
    );
    await db.runAsync("DELETE FROM workouts WHERE user_id = ?", [userId]);

    for (const workout of workouts) {
      await db.runAsync(
        `INSERT OR REPLACE INTO workouts
           (id, user_id, title, goal, equipment_json, level, duration_minutes, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [workout.id, userId, workout.title, workout.goal, workout.equipment, workout.level, workout.durationMinutes, now]
      );

      for (let i = 0; i < workout.exercises.length; i++) {
        const ex = workout.exercises[i];
        await db.runAsync(
          `INSERT OR REPLACE INTO workout_exercises
             (id, workout_id, exercise_id, name, muscle_group, required_equipment,
              difficulty_level, sets, reps, rest, weight, cycle, position)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ex.id, workout.id, ex.id, ex.name, ex.muscle,
            ex.requiredEquipment ?? null,
            ex.difficultyLevel != null ? String(ex.difficultyLevel) : null,
            ex.sets, ex.reps, ex.restSeconds, ex.weight ?? null, 0, i,
          ]
        );
      }
    }

    // Populate the exercises table so getCachedExerciseById works during
    // training even when the library page has never been visited.
    const toCache = workouts
      .flatMap((w) => w.exercises)
      .filter((ex) => ex.imageUri || ex.description)
      .map((ex) => ({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscle ?? "",
        requiredEquipment: ex.requiredEquipment,
        difficultyLevel: ex.difficultyLevel != null ? String(ex.difficultyLevel) : undefined,
        description: ex.description,
        imageUri: ex.imageUri,
      }));
    if (toCache.length > 0) {
      await cacheExercises(toCache);
    }
  } catch {
    // Cache write failures are non-fatal.
  }
}

// ---------------------------------------------------------------------------
// Offline-first fetch
// Returns cached data immediately while refreshing from API in the background.
// Calls onFresh when fresh data arrives so the caller can update state.
// ---------------------------------------------------------------------------

export async function getWorkoutsOfflineFirst(
  userId: string,
  onFresh: (workouts: WorkoutSummary[]) => void
): Promise<WorkoutSummary[]> {
  const cached = await getCachedWorkouts(userId);

  // Fire background refresh regardless — keeps cache warm.
  void getUserWorkouts(userId)
    .then((fresh) => {
      void cacheWorkouts(userId, fresh);
      onFresh(fresh);
    })
    .catch(() => {
      // Offline or API error — cached data is enough.
    });

  return cached;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function rowToWorkout(row: WorkoutRow, exercises: ExerciseRow[]): WorkoutSummary {
  return {
    id: row.id,
    title: row.title,
    goal: row.goal,
    equipment: row.equipment_json,
    level: row.level,
    durationMinutes: row.duration_minutes,
    exercises: exercises.map(rowToExercise),
  };
}

function rowToExercise(row: ExerciseRow): WorkoutExercise {
  return {
    id: row.exercise_id ?? row.id,
    name: row.name,
    muscle: row.muscle_group ?? "",
    sets: row.sets,
    reps: row.reps,
    restSeconds: row.rest,
    weight: row.weight ?? undefined,
    requiredEquipment: row.required_equipment ?? undefined,
    difficultyLevel: row.difficulty_level != null ? Number(row.difficulty_level) : undefined,
  };
}
