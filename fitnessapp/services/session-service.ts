import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CompleteWorkoutExerciseInput } from "@/services/fitness-service";
import {
  ACCESS_TOKEN_KEY,
  CURRENT_WORKOUT_ID_KEY,
  CURRENT_WORKOUT_PROGRESS_KEY,
  PENDING_WORKOUT_COMPLETION_KEY,
  REFRESH_TOKEN_KEY,
  USER_ID_KEY,
} from "@/services/storage";

type WorkoutProgressSnapshot = {
  workoutId: string;
  progressByExercise: Record<string, boolean[]>;
};

type PendingWorkoutCompletion = {
  workoutId: string;
  exercises: CompleteWorkoutExerciseInput[];
};

type RecoveryMetrics = {
  sleepHours?: number;
  sleepQuality?: number; // 1-5
  stressLevel?: number; // 1-10
};

export async function getStoredUserId() {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function setStoredUserId(userId: string) {
  return AsyncStorage.setItem(USER_ID_KEY, userId);
}

export async function clearStoredUserId() {
  return AsyncStorage.removeItem(USER_ID_KEY);
}

export async function getStoredAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function setStoredAccessToken(accessToken: string) {
  return AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export async function clearStoredAccessToken() {
  return AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function getStoredRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setStoredRefreshToken(refreshToken: string) {
  return AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearStoredRefreshToken() {
  return AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function getStoredWorkoutId() {
  return AsyncStorage.getItem(CURRENT_WORKOUT_ID_KEY);
}

export async function setStoredWorkoutId(workoutId: string) {
  return AsyncStorage.setItem(CURRENT_WORKOUT_ID_KEY, workoutId);
}

export async function getWorkoutProgress(workoutId: string) {
  const raw = await AsyncStorage.getItem(CURRENT_WORKOUT_PROGRESS_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as WorkoutProgressSnapshot;
    if (parsed.workoutId !== workoutId) {
      return null;
    }

    return parsed.progressByExercise;
  } catch {
    return null;
  }
}

export async function setWorkoutProgress(workoutId: string, progressByExercise: Record<string, boolean[]>) {
  const payload: WorkoutProgressSnapshot = {
    workoutId,
    progressByExercise,
  };

  return AsyncStorage.setItem(CURRENT_WORKOUT_PROGRESS_KEY, JSON.stringify(payload));
}

export async function clearWorkoutProgress() {
  return AsyncStorage.removeItem(CURRENT_WORKOUT_PROGRESS_KEY);
}

export async function setPendingWorkoutCompletion(payload: PendingWorkoutCompletion) {
  return AsyncStorage.setItem(PENDING_WORKOUT_COMPLETION_KEY, JSON.stringify(payload));
}

export async function getPendingWorkoutCompletion() {
  const raw = await AsyncStorage.getItem(PENDING_WORKOUT_COMPLETION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PendingWorkoutCompletion;
  } catch {
    return null;
  }
}

export async function clearPendingWorkoutCompletion() {
  return AsyncStorage.removeItem(PENDING_WORKOUT_COMPLETION_KEY);
}

const RECOVERY_METRICS_KEY = "recovery_metrics";

export async function setRecoveryMetrics(payload: RecoveryMetrics) {
  return AsyncStorage.setItem(RECOVERY_METRICS_KEY, JSON.stringify(payload));
}

export async function getRecoveryMetrics(): Promise<RecoveryMetrics | null> {
  const raw = await AsyncStorage.getItem(RECOVERY_METRICS_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RecoveryMetrics;
  } catch {
    return null;
  }
}

export async function clearRecoveryMetrics() {
  return AsyncStorage.removeItem(RECOVERY_METRICS_KEY);
}

