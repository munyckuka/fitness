import { getDb } from "@/services/database";
import { getProgress, type ProgressData } from "@/services/fitness-service";

type ProgressCacheRow = {
  user_id: string;
  workout_dates_json: string | null;
  weight_history_json: string | null;
  cached_at: number;
};

type LocalLogRow = {
  completed_at: number;
};

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getCachedProgress(userId: string): Promise<ProgressData> {
  try {
    const db = await getDb();

    const [row, localLogs] = await Promise.all([
      db.getFirstAsync<ProgressCacheRow>(
        "SELECT * FROM progress_cache WHERE user_id = ?",
        [userId]
      ),
      // Include unsynced local completions so the calendar updates immediately
      // after an offline workout — before the server confirms the sync.
      db.getAllAsync<LocalLogRow>(
        "SELECT completed_at FROM workout_logs WHERE user_id = ? AND synced = 0",
        [userId]
      ),
    ]);

    const apiDates: string[] = safeParseArray(row?.workout_dates_json);
    const localDates = localLogs.map((log) =>
      new Date(log.completed_at).toISOString().slice(0, 10)
    );

    // Merge server dates with local unsynced dates, keep unique and sorted.
    const allDates = Array.from(new Set([...apiDates, ...localDates])).sort();
    const weightHistory: ProgressData["weightHistory"] = safeParseArray(row?.weight_history_json);

    return { workoutDates: allDates, weightHistory };
  } catch {
    return { workoutDates: [], weightHistory: [] };
  }
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function cacheProgress(userId: string, data: ProgressData): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO progress_cache
         (user_id, workout_dates_json, weight_history_json, cached_at)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        JSON.stringify(data.workoutDates),
        JSON.stringify(data.weightHistory),
        Date.now(),
      ]
    );
  } catch {
    // Cache write failures are non-fatal.
  }
}

// ---------------------------------------------------------------------------
// Offline-first fetch
// ---------------------------------------------------------------------------

export async function getProgressOfflineFirst(
  userId: string,
  onFresh: (data: ProgressData) => void
): Promise<ProgressData> {
  const cached = await getCachedProgress(userId);

  void getProgress(userId)
    .then((fresh) => {
      void cacheProgress(userId, fresh);
      onFresh(fresh);
    })
    .catch(() => {
      // Offline — cached data (including local unsynced dates) is enough.
    });

  return cached;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function safeParseArray<T>(json: string | null | undefined): T[] {
  try {
    const parsed = JSON.parse(json ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
