import { getDb } from "@/services/database";
import { searchExercises, type ExerciseSearchResult } from "@/services/fitness-service";

type ExerciseRow = {
  id: string;
  name: string;
  muscle_group: string | null;
  required_equipment: string | null;
  difficulty_level: string | null;
  description: string | null;
  photo_path: string | null;
};

// ---------------------------------------------------------------------------
// Read — local SQLite search
// ---------------------------------------------------------------------------

export async function searchCachedExercises(
  query?: string,
  muscle?: string,
  limit = 50
): Promise<ExerciseSearchResult[]> {
  try {
    const db = await getDb();

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (query && query.trim()) {
      conditions.push("LOWER(name) LIKE ?");
      params.push(`%${query.trim().toLowerCase()}%`);
    }
    if (muscle && muscle.trim()) {
      conditions.push("muscle_group = ?");
      params.push(muscle.trim());
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(limit);

    const rows = await db.getAllAsync<ExerciseRow>(
      `SELECT * FROM exercises ${where} ORDER BY name ASC LIMIT ?`,
      params
    );

    return rows.map(rowToResult);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function cacheExercises(exercises: ExerciseSearchResult[]): Promise<void> {
  if (exercises.length === 0) return;

  try {
    const db = await getDb();
    const now = Date.now();

    for (const ex of exercises) {
      await db.runAsync(
        `INSERT OR REPLACE INTO exercises
           (id, name, muscle_group, required_equipment, difficulty_level, description, photo_path, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ex.id,
          ex.name,
          ex.muscleGroup ?? null,
          ex.requiredEquipment ?? null,
          ex.difficultyLevel ?? null,
          ex.description ?? null,
          ex.imageUri ?? null,
          now,
        ]
      );
    }
  } catch {
    // Cache write failures are non-fatal.
  }
}

// ---------------------------------------------------------------------------
// Offline-first search
// Tries API first; if offline, falls back to local SQLite search.
// Caches API results for future offline use.
// ---------------------------------------------------------------------------

export async function searchExercisesOfflineFirst(
  query?: string,
  muscle?: string,
  limit = 50
): Promise<ExerciseSearchResult[]> {
  try {
    const fresh = await searchExercises(query, muscle, limit);
    void cacheExercises(fresh);
    return fresh;
  } catch {
    // API unavailable — search local cache.
    return searchCachedExercises(query, muscle, limit);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function rowToResult(row: ExerciseRow): ExerciseSearchResult {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group ?? "",
    requiredEquipment: row.required_equipment ?? undefined,
    difficultyLevel: row.difficulty_level ?? undefined,
    description: row.description ?? undefined,
    imageUri: row.photo_path ?? undefined,
  };
}
