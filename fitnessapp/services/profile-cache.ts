import { getDb } from "@/services/database";
import { getUser, updateUser, type UserProfile, type UpdateUserInput } from "@/services/fitness-service";
import { enqueue, flushQueue } from "@/services/sync-service";

type ProfileRow = {
  user_id: string;
  name: string;
  goal: string | null;
  experience: string | null;
  frequency: number | null;
  equipment_json: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  cached_at: number;
};

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getCachedProfile(userId: string): Promise<UserProfile | null> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<ProfileRow>(
      "SELECT * FROM user_profile WHERE user_id = ?",
      [userId]
    );
    return row ? rowToProfile(row) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function cacheProfile(profile: UserProfile): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO user_profile
         (user_id, name, goal, experience, frequency, equipment_json, age, height, weight, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.name,
        profile.goal ?? null,
        profile.experience ?? null,
        profile.frequency ?? null,
        JSON.stringify(profile.equipmentList),
        profile.age ?? null,
        profile.height ?? null,
        profile.weight ?? null,
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

export async function getProfileOfflineFirst(
  userId: string,
  onFresh: (profile: UserProfile) => void
): Promise<UserProfile | null> {
  const cached = await getCachedProfile(userId);

  void getUser(userId)
    .then((fresh) => {
      void cacheProfile(fresh);
      onFresh(fresh);
    })
    .catch(() => {
      // Offline or API error — cached data is enough.
    });

  return cached;
}

// ---------------------------------------------------------------------------
// Offline-first update
// Saves locally first, queues API sync — profile update never blocks the UI.
// ---------------------------------------------------------------------------

export async function updateProfileOfflineFirst(
  userId: string,
  input: UpdateUserInput
): Promise<void> {
  try {
    const db = await getDb();

    // Optimistically update local cache.
    await db.runAsync(
      `UPDATE user_profile
       SET goal = ?, experience = ?, frequency = ?, equipment_json = ?,
           age = ?, height = ?, weight = ?, cached_at = ?
       WHERE user_id = ?`,
      [
        input.goal,
        input.experience,
        input.frequency,
        JSON.stringify(input.equipment),
        input.age ?? null,
        input.height ?? null,
        input.weight ?? null,
        Date.now(),
        userId,
      ]
    );

    // Enqueue for server sync.
    await enqueue("update_profile", {
      fitnessGoal: input.goal,
      fitnessLevel: input.experience,
      frequency: input.frequency,
      equipment: input.equipment,
      age: input.age ?? 0,
      height: input.height ?? 0,
      weight: input.weight ?? 0,
    });

    void flushQueue();
  } catch {
    // SQLite unavailable — fall back to direct API call.
    await updateUser(userId, input);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function rowToProfile(row: ProfileRow): UserProfile {
  let equipmentList: string[] = [];
  try {
    const parsed = JSON.parse(row.equipment_json ?? "[]");
    equipmentList = Array.isArray(parsed) ? parsed : [];
  } catch {
    equipmentList = [];
  }

  return {
    id: row.user_id,
    name: row.name,
    goal: row.goal ?? "",
    experience: row.experience ?? "",
    equipment: equipmentList[0] ?? "",
    equipmentList,
    frequency: row.frequency ?? undefined,
    age: row.age ?? undefined,
    height: row.height ?? undefined,
    weight: row.weight ?? undefined,
  };
}
