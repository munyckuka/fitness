import { apiRequest } from "@/services/api";
import { ensureAccessToken, refreshAccessToken } from "@/services/auth-service";

export type WorkoutExercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  restSeconds: number;
  weight?: number;
  imageUri?: string;
  description?: string;
  requiredEquipment?: string;
  difficultyLevel?: number;
};

export type WorkoutSummary = {
  id: string;
  title: string;
  goal: string;
  equipment: string;
  level: string;
  durationMinutes: number;
  exercises: WorkoutExercise[];
  splitPart?: string;
};

export type UserProfile = {
  id: string;
  name: string;
  login?: string;
  gender?: string;
  goal: string;
  experience: string;
  equipment: string;
  equipmentList: string[];
  age?: number;
  height?: number;
  weight?: number;
  frequency?: number;
};

export type ProgressData = {
  workoutDates: string[];
  weightHistory: Array<{ label: string; value: number }>;
};

export type CreateUserInput = {
  goal: string;
  experience: string;
  frequency: number;
  equipment: string[];
  age?: number;
  height?: number;
  weight?: number;
};

export type UpdateUserInput = {
  goal: string;
  experience: string;
  frequency: number;
  equipment: string[];
  age?: number;
  height?: number;
  weight?: number;
};

export type CompleteWorkoutExerciseSetInput = {
  reps: number;
  weight: number;
  rpe?: number;
};

export type CompleteWorkoutExerciseInput = {
  exerciseId: string;
  sets: CompleteWorkoutExerciseSetInput[];
};

export async function createUser(input: CreateUserInput) {
  const payload = await apiRequest<BackendUser>("/users/", {
    method: "POST",
    body: JSON.stringify({
      age: input.age ?? 0,
      height: input.height ?? 0,
      weight: input.weight ?? 0,
      fitnessLevel: input.experience,
      fitnessGoal: input.goal,
      frequency: input.frequency,
      equipment: input.equipment,
    }),
  });

  return normalizeUser(payload);
}

export async function getUser(userId: string) {
  const payload = await apiRequest<BackendUser>(`/users/${userId}`);
  return normalizeUser(payload);
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  const payload = await apiRequest<BackendUser>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({
      age: input.age ?? 0,
      height: input.height ?? 0,
      weight: input.weight ?? 0,
      fitnessLevel: input.experience,
      fitnessGoal: input.goal,
      frequency: input.frequency,
      equipment: input.equipment,
    }),
  });

  return normalizeUser(payload);
}

export async function generateWorkout(userId: string, user?: Pick<UserProfile, "goal" | "experience" | "equipment">) {
  const raw = await requestWithAuth<{ workout: BackendWorkout; warning?: string; recoveryHint?: string }>(
    "/workouts/generate",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    userId,
  );

  // Backend wraps the workout in { workout: {...}, warning: "...", recoveryHint: "..." }
  const payload: BackendWorkout = raw.workout ?? (raw as unknown as BackendWorkout);
  const workout = normalizeWorkout(payload, user);

  // If user has no equipment (Домашний) filter out exercises that require external equipment.
  try {
    const userEquip = user?.equipment ?? "";
    if (userEquip === "Домашний" || userEquip === "") {
      workout.exercises = workout.exercises.filter((ex) => {
        const req = (ex.requiredEquipment ?? "").toLowerCase();
        if (!req) return true;
        // allow bodyweight-type exercises
        return req.includes("body") || req.includes("bodyweight");
      });
    }
  } catch {
    // if any error during filtering, return original workout
  }

  return workout;
}

export async function getUserWorkouts(userId: string) {
  const [payload, user] = await Promise.all([apiRequest<BackendWorkout[]>(`/workouts/user/${userId}`), getUser(userId)]);
  const collection = Array.isArray(payload) ? payload : [];

  const workouts = collection.map((item) => normalizeWorkout(item, user));

  // apply same equipment filter for generated week when user has no equipment
  try {
    const userEquip = user?.equipment ?? "";
    if (userEquip === "Домашний" || userEquip === "") {
      return workouts.map((w) => ({
        ...w,
        exercises: w.exercises.filter((ex) => {
          const req = (ex.requiredEquipment ?? "").toLowerCase();
          if (!req) return true;
          return req.includes("body") || req.includes("bodyweight");
        }),
      }));
    }
  } catch {
    // ignore
  }

  return workouts;
}

export type RecoveryMetrics = {
  sleepHours?: number;
  sleepQuality?: number; // 1-5
  stressLevel?: number; // 1-10
};

export async function completeWorkout(input: {
  userId: string;
  workoutId: string;
  difficulty: number;
  exercises: CompleteWorkoutExerciseInput[];
  recovery?: RecoveryMetrics;
}) {
  const bodyPayload: any = {
    workoutId: input.workoutId,
    difficulty: input.difficulty,
    exercises: input.exercises,
  };

  if (input.recovery) {
    bodyPayload.recovery = input.recovery;
  }

  return requestWithAuth<unknown>(
    "/workouts/complete",
    {
      method: "POST",
      body: JSON.stringify(bodyPayload),
    },
    input.userId,
  );
}

export async function getProgress(userId: string) {
  const payload = await apiRequest<BackendProgress>(`/progress/${userId}`);
  return normalizeProgress(payload);
}
function normalizeUser(payload: BackendUser): UserProfile {
  const equipment = Array.isArray(payload.equipment) ? payload.equipment : [];
  const normalizedName = typeof payload.name === "string" && payload.name.trim().length > 0 ? payload.name.trim() : "Пользователь";

  return {
    id: payload.id,
    name: normalizedName,
    login: payload.login,
    goal: localizeGoal(payload.fitnessGoal),
    experience: localizeLevel(payload.fitnessLevel),
    equipment: deriveEquipmentLabel(equipment),
    equipmentList: equipment.map(localizeEquipment),
    age: payload.age,
    height: payload.height,
    weight: payload.weight,
    frequency: payload.frequency,
  };
}

function normalizeWorkout(payload: BackendWorkout, user?: Pick<UserProfile, "goal" | "experience" | "equipment">): WorkoutSummary {
  const exercises = (Array.isArray(payload.exercises) ? payload.exercises : []).map((exercise, index) =>
    normalizeExercise(exercise, String(index + 1)),
  );

  return {
    id: payload.id,
    title: buildWorkoutTitle(payload.splitPart, user?.goal),
    goal: user?.goal ?? "Персональный план",
    equipment: user?.equipment ?? "Индивидуальный подбор",
    level: user?.experience ?? "По вашему уровню",
    durationMinutes: Math.max(exercises.length * 8, 30),
    exercises,
    splitPart: payload.splitPart,
  };
}

function normalizeExercise(payload: BackendWorkoutExercise, fallbackId: string): WorkoutExercise {
  return {
    id: payload.exerciseId ?? fallbackId,
    name: payload.name,
    muscle: localizeMuscleGroup(payload.muscleGroup),
    sets: payload.sets,
    reps: payload.reps,
    restSeconds: payload.rest,
    weight: typeof payload.weight === "number" ? Math.round(payload.weight * 10) / 10 : undefined,
    imageUri: typeof (payload as any).photoPath === "string" && (payload as any).photoPath.length > 0 ? (payload as any).photoPath : undefined,
    description: typeof (payload as any).description === "string" ? (payload as any).description : undefined,
    requiredEquipment: typeof (payload as any).requiredEquipment === "string" ? (payload as any).requiredEquipment : undefined,
    difficultyLevel: typeof (payload as any).difficultyLevel === "number" ? (payload as any).difficultyLevel : undefined,
  };
}

export async function generateWeekWorkouts(userId: string, startDate: string) {
  const payload = await requestWithAuth<BackendWorkout[]>(
    "/workouts/generate-week",
    {
      method: "POST",
      body: JSON.stringify({ startDate }),
    },
    userId,
  );

  const collection = Array.isArray(payload) ? payload : [];
  const user = await getUser(userId).catch(() => undefined);

  return collection.map((item) => normalizeWorkout(item, user));
}

export async function deleteWorkout(userId: string, workoutId: string): Promise<void> {
  await requestWithAuth(
    `/workouts/${workoutId}`,
    { method: "DELETE" },
    userId,
  );
}

export async function replaceExercise(userId: string, workoutId: string, oldExerciseId: string, newExerciseId: string) {
  await requestWithAuth(
    `/workouts/${workoutId}/exercises/${oldExerciseId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ newExerciseId }),
    },
    userId,
  );
}

export type ExerciseSearchResult = {
  id: string;
  name: string;
  muscleGroup: string;
  requiredEquipment?: string;
  difficultyLevel?: string;
  imageUri?: string;
  description?: string;
  // labels for display
  muscleGroupLabel?: string;
  requiredEquipmentLabel?: string;
  difficultyLabel?: string;
};

type BackendExerciseDTO = ExerciseSearchResult & { photoPath?: string };

export async function searchExercises(query?: string, muscle?: string, limit?: number) {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (muscle) params.append("muscle", muscle);
  if (limit && limit > 0) params.append("limit", String(limit));

  const payload = await apiRequest<BackendExerciseDTO[]>(`/exercises?${params.toString()}`);
  if (!Array.isArray(payload)) return [];
  return payload.map((ex) => ({
    ...ex,
    imageUri: ex.photoPath && ex.photoPath.length > 0 ? ex.photoPath : undefined,
  }));
}

function normalizeProgress(payload: BackendProgress): ProgressData {
  return {
    workoutDates: payload.workoutDates ?? [],
    weightHistory: (payload.weightHistory ?? []).map((item) => ({
      label: localizeMonth(item.label),
      value: item.value,
    })),
  };
}

type BackendUser = {
  id: string;
  name?: string;
  login?: string;
  age: number;
  height: number;
  weight: number;
  fitnessLevel: string;
  fitnessGoal: string;
  frequency: number;
  equipment: string[] | null;
};

type BackendWorkoutExercise = {
  exerciseId?: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  rest: number;
  weight?: number;
};

type BackendWorkout = {
  id: string;
  userId: string;
  splitPart?: string;
  dayIndex?: number;
  exercises: BackendWorkoutExercise[] | null;
};

type BackendProgress = {
  userId: string;
  completedWorkouts: number;
  avgDifficulty: number;
  workoutDates: string[];
  weightHistory: Array<{ label: string; value: number }>;
};

async function requestWithAuth<T>(path: string, options: RequestInit, legacyUserIdForLogin?: string) {
  const accessToken = await ensureAccessToken(legacyUserIdForLogin);

  try {
    return await apiRequest<T>(path, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    const refreshedAccessToken = await refreshAccessToken();
    if (!refreshedAccessToken) {
      throw error;
    }

    return apiRequest<T>(path, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${refreshedAccessToken}`,
      },
    });
  }
}

function buildWorkoutTitle(splitPart?: string, goal?: string): string {
  switch (splitPart) {
    case "push":
      return "День жима";
    case "pull":
      return "День тяг";
    case "legs":
      return "День ног";
    case "upper":
      return "Тренировка верха";
    case "lower":
      return "Тренировка низа";
    default:
      switch (goal) {
        case "Сила":          return "Силовая тренировка";
        case "Рост мышц":     return "Тренировка на рост мышц";
        case "Похудение":     return "Жиросжигающая тренировка";
        case "Выносливость":  return "Тренировка на выносливость";
        default:              return "Персональная тренировка";
      }
  }
}

function localizeGoal(goal: string) {
  switch (goal) {
    case "strength":
      return "Сила";
    case "mass":
    case "hypertrophy":
      return "Рост мышц";
    case "weight_loss":
      return "Похудение";
    case "endurance":
      return "Выносливость";
    default:
      return goal;
  }
}

function localizeLevel(level: string) {
  switch (level) {
    case "beginner":
      return "Новичок";
    case "intermediate":
      return "Средний";
    case "advanced":
      return "Продвинутый";
    default:
      return level;
  }
}

function localizeEquipment(equipment: string) {
  switch (equipment) {
    case "":
    case "bodyweight":
      return "Домашний";
    case "dumbbell":
    case "dumbbells":
      return "Гантели";
    case "pullup_bar":
    case "outdoor":
      return "Спортивная площадка";
    case "barbell":
    case "gym":
    case "machine":
      return "Тренажерный зал";
    case "cable":
      return "Кроссовер/Кабель";
    case "kettlebell":
      return "Кеттлбелл";
    case "band":
      return "Резинка";
    case "medicine ball":
      return "Мяч";
    case "none":
      return "Нет";
    default:
      return equipment;
  }
}

// Derives a single display label from an array of backend equipment values.
// Priority mirrors the UI options in create-workout.tsx.
function deriveEquipmentLabel(rawList: string[]): string {
  if (rawList.includes("barbell") || rawList.includes("machine")) return "Тренажерный зал";
  if (rawList.includes("kettlebell")) return "Кеттлбелл";
  if (rawList.includes("cable")) return "Кроссовер/Кабель";
  if (rawList.includes("dumbbell")) return "Гантели";
  if (rawList.includes("pullup_bar")) return "Спортивная площадка";
  if (rawList.includes("band")) return "Резинка";
  if (rawList.includes("medicine ball")) return "Мяч";
  if (rawList.includes("none")) return "Нет";
  return "Домашний";
}

function localizeMuscleGroup(muscleGroup: string) {
  switch (muscleGroup) {
    case "chest":
      return "Грудь";
    case "shoulder":
    case "shoulders":
      return "Плечи";
    case "tricep":
    case "triceps":
      return "Трицепс";
    case "back":
      return "Спина";
    case "bicep":
    case "biceps":
      return "Бицепс";
    case "quadriceps":
      return "Квадрицепс";
    case "hamstrings":
      return "Бицепс бедра";
    case "calves":
      return "Икры";
    case "glutes":
      return "Ягодицы";
    case "core":
      return "Кор";
    case "legs":
      return "Ноги";
    case "full body":
      return "Всё тело";
    default:
      return "Основная группа";
  }
}

function localizeMonth(month: string) {
  const months: Record<string, string> = {
    Jan: "Янв",
    Feb: "Фев",
    Mar: "Мар",
    Apr: "Апр",
    May: "Май",
    Jun: "Июн",
    Jul: "Июл",
    Aug: "Авг",
    Sep: "Сен",
    Oct: "Окт",
    Nov: "Ноя",
    Dec: "Дек",
  };

  return months[month] ?? month;
}