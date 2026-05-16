import { apiRequest, ApiError } from "@/services/api";
import {
  clearStoredAccessToken,
  clearStoredRefreshToken,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredAccessToken,
  setStoredRefreshToken,
} from "@/services/session-service";
import type { UserProfile } from "@/services/fitness-service";

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    login: string;
    age: number;
    height: number;
    weight: number;
    fitnessLevel: string;
    fitnessGoal: string;
    frequency: number;
    equipment: string[];
  };
};

type RegisterInput = {
  name: string;
  login: string;
  email: string;
  password: string;
  goal: string;
  experience: string;
  frequency: number;
  equipment: string[];
  age?: number;
  height?: number;
  weight?: number;
};

export const LEGACY_DEFAULT_PASSWORD = "123";
const APP_DEFAULT_PASSWORD = "Pass1234";

export async function loginWithIdentifier(identifier: string, password: string) {
  const payload = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });

  await persistTokens(payload);
  return payload;
}

export async function loginWithEmail(email: string, password: string) {
  return loginWithIdentifier(email, password);
}

export async function loginLegacyByUserId(userId: string) {
  return loginWithIdentifier(buildLegacyEmail(userId), LEGACY_DEFAULT_PASSWORD);
}

export async function registerWithProfile(input: RegisterInput) {
  const payload = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      login: input.login,
      email: input.email,
      password: input.password,
      age: input.age ?? 0,
      height: input.height ?? 0,
      weight: input.weight ?? 0,
      fitnessLevel: input.experience,
      fitnessGoal: input.goal,
      frequency: input.frequency,
      equipment: input.equipment,
    }),
  });

  await persistTokens(payload);
  return payload;
}

export async function registerAppUser(input: Omit<RegisterInput, "email" | "password">) {
  const email = buildAppEmail();
  return registerWithProfile({ ...input, email, password: APP_DEFAULT_PASSWORD });
}

export async function refreshAccessToken() {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const payload = await apiRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    await persistTokens(payload);
    return payload.accessToken;
  } catch (error) {
    await clearStoredAccessToken();
    await clearStoredRefreshToken();

    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function ensureAccessToken(userIdForLegacyFallback?: string) {
  const accessToken = await getStoredAccessToken();
  if (accessToken) {
    return accessToken;
  }

  const refreshed = await refreshAccessToken();
  if (refreshed) {
    return refreshed;
  }

  if (userIdForLegacyFallback) {
    const payload = await loginLegacyByUserId(userIdForLegacyFallback);
    return payload.accessToken;
  }

  throw new Error("Требуется авторизация. Выполните вход заново.");
}

export async function logout() {
  const refreshToken = await getStoredRefreshToken();
  if (refreshToken) {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore network/API errors and clear local session anyway.
    }
  }

  await clearStoredAccessToken();
  await clearStoredRefreshToken();
}

export function buildLegacyEmail(userId: string) {
  return `${userId}@legacy.local`;
}

export function mapGoalToBackend(goal?: string) {
  switch (goal) {
    case "Сила":
      return "strength";
    case "Рост мышц":
      return "mass";
    case "Выносливость":
      return "endurance";
    case "Похудение":
      return "weight_loss";
    default:
      return "mass";
  }
}

export function mapLevelToBackend(level?: string) {
  switch (level) {
    case "Новичок":
      return "beginner";
    case "Базовый":
    case "Средний":
      return "intermediate";
    case "Продвинутый":
      return "advanced";
    default:
      return "beginner";
  }
}

export function mapEquipmentToBackend(equipment?: string) {
  switch (equipment) {
    case "Домашний":
      return "";
    case "Гантели":
      return "dumbbell";
    case "Спортивная площадка":
      return "pullup_bar";
    case "Тренажерный зал":
      return "barbell";
    case "Кеттлбелл":
      return "kettlebell";
    case "Кроссовер/Кабель":
      return "cable";
    case "Резинка":
      return "band";
    case "Мяч":
      return "medicine ball";
    case "Нет":
      return "none";
    default:
      return "";
  }
}

export function buildRegisterPayloadFromProfile(user: UserProfile) {
  return {
    goal: mapGoalToBackend(user.goal),
    experience: mapLevelToBackend(user.experience),
    frequency: user.frequency ?? 3,
    equipment: [mapEquipmentToBackend(user.equipmentList[0] ?? user.equipment)],
    age: user.age,
    height: user.height,
    weight: user.weight,
  };
}

async function persistTokens(payload: AuthResponse) {
  await setStoredAccessToken(payload.accessToken);
  await setStoredRefreshToken(payload.refreshToken);
}

function buildAppEmail() {
  return `user-${Date.now()}-${Math.floor(Math.random() * 100000)}@app.local`;
}
