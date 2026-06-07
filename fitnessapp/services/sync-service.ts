import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { apiRequest } from "@/services/api";
import { ensureAccessToken, refreshAccessToken } from "@/services/auth-service";
import { getDb } from "@/services/database";
import { isOnline, useNetworkStatus } from "@/services/network";
import { getStoredUserId } from "@/services/session-service";

export type SyncOperationType = "complete_workout" | "update_profile";

export type SyncStatus = "idle" | "syncing" | "error";

type QueueRow = {
  id: number;
  operation: SyncOperationType;
  payload_json: string;
  status: string;
  attempts: number;
};

const MAX_ATTEMPTS = 3;

let _isFlushing = false;

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function enqueue(operation: SyncOperationType, payload: unknown): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO sync_queue (operation, payload_json, status, attempts, created_at) VALUES (?, ?, 'pending', 0, ?)",
    [operation, JSON.stringify(payload), Date.now()]
  );
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'failed')"
  );
  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Flush
// ---------------------------------------------------------------------------

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  if (_isFlushing) return { synced: 0, failed: 0 };
  if (!(await isOnline())) return { synced: 0, failed: 0 };

  _isFlushing = true;
  let synced = 0;
  let failed = 0;

  try {
    const db = await getDb();
    const rows = await db.getAllAsync<QueueRow>(
      "SELECT * FROM sync_queue WHERE status IN ('pending', 'failed') AND attempts < ? ORDER BY created_at ASC",
      [MAX_ATTEMPTS]
    );

    for (const row of rows) {
      await db.runAsync(
        "UPDATE sync_queue SET status = 'processing', last_attempt_at = ?, attempts = attempts + 1 WHERE id = ?",
        [Date.now(), row.id]
      );

      try {
        await executeOperation(row.operation, JSON.parse(row.payload_json));
        await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [row.id]);
        synced++;
      } catch {
        const nextAttempts = row.attempts + 1;
        const nextStatus = nextAttempts >= MAX_ATTEMPTS ? "failed" : "pending";
        await db.runAsync(
          "UPDATE sync_queue SET status = ?, last_attempt_at = ? WHERE id = ?",
          [nextStatus, Date.now(), row.id]
        );
        failed++;
      }
    }
  } finally {
    _isFlushing = false;
  }

  return { synced, failed };
}

// ---------------------------------------------------------------------------
// Hook — use in components to show sync badge and trigger flush on reconnect
// ---------------------------------------------------------------------------

export function useSyncStatus(): { status: SyncStatus; pendingCount: number; flush: () => void } {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const online = useNetworkStatus();
  const appStateRef = { current: AppState.currentState };

  const refresh = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  const flush = async () => {
    setStatus("syncing");
    try {
      const result = await flushQueue();
      if (result.failed > 0) {
        setStatus("error");
      } else {
        setStatus("idle");
      }
      await refresh();
    } catch {
      setStatus("error");
    }
  };

  // Auto-flush when coming back online or foregrounded
  useEffect(() => {
    void refresh();

    if (online) {
      void flush();
    }
  }, [online]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active" && appStateRef.current !== "active") {
        void refresh();
        void flush();
      }
      appStateRef.current = next;
    });

    return () => subscription.remove();
  }, []);

  return { status, pendingCount, flush };
}

// ---------------------------------------------------------------------------
// Internal — execute one queued operation against the API
// ---------------------------------------------------------------------------

async function executeOperation(operation: SyncOperationType, payload: unknown): Promise<void> {
  const userId = await getStoredUserId();
  const token = await withTokenRefresh(() => ensureAccessToken(userId ?? undefined));
  const authHeaders = { Authorization: `Bearer ${token}` };

  switch (operation) {
    case "complete_workout":
      await apiRequest("/workouts/complete", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      break;

    case "update_profile":
      if (!userId) throw new Error("No userId in session");
      await apiRequest(`/users/${userId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      break;
  }
}

async function withTokenRefresh<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    const refreshed = await refreshAccessToken();
    if (!refreshed) throw new Error("Session expired");
    return fn();
  }
}
