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
};

export type WorkoutSummary = {
  id: string;
  title: string;
  goal: string;
  equipment: string;
  level: string;
  durationMinutes: number;
  exercises: WorkoutExercise[];
};

export type UserProfile = {
  id: string;
  name: string;
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
};

export type CompleteWorkoutExerciseInput = {
  exercise_id: string;
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
  const payload = await requestWithAuth<BackendWorkout>(
    "/workouts/generate",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    userId,
  );

  return normalizeWorkout(payload, user);
}

export async function getUserWorkouts(userId: string) {
  const [payload, user] = await Promise.all([apiRequest<BackendWorkout[]>(`/workouts/user/${userId}`), getUser(userId)]);
  const collection = Array.isArray(payload) ? payload : [];

  return collection.map((item) => normalizeWorkout(item, user));
}

export async function completeWorkout(input: {
  userId: string;
  workoutId: string;
  difficulty: number;
  exercises: CompleteWorkoutExerciseInput[];
}) {
  return requestWithAuth<unknown>(
    "/workouts/complete",
    {
      method: "POST",
      body: JSON.stringify({
        workoutId: input.workoutId,
        difficulty: input.difficulty,
        exercises: input.exercises,
      }),
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
    goal: localizeGoal(payload.fitnessGoal),
    experience: localizeLevel(payload.fitnessLevel),
    equipment: equipment.map(localizeEquipment).join(", "),
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
    title: buildWorkoutTitle(user?.goal),
    goal: user?.goal ?? "Персональный план",
    equipment: user?.equipment ?? "Индивидуальный подбор",
    level: user?.experience ?? "По вашему уровню",
    durationMinutes: Math.max(exercises.length * 8, 30),
    exercises,
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
  };
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

function buildWorkoutTitle(goal?: string) {
  switch (goal) {
    case "Сила":
      return "Силовая тренировка";
    case "Рост мышц":
      return "Тренировка на рост мышц";
    case "Похудение":
      return "Жиросжигающая тренировка";
    default:
      return "Персональная тренировка";
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
      return "Домашний";
    case "dumbbell":
    case "bodyweight":
      return "Домашний";
    case "dumbbells":
      return "Гантели";
    case "pullup_bar":
    case "outdoor":
      return "Спортивная площадка";
    case "barbell":
    case "gym":
      return "Тренажерный зал";
    default:
      return equipment;
  }
}

function localizeMuscleGroup(muscleGroup: string) {
  switch (muscleGroup) {
    case "chest":
      return "Грудь";
    case "shoulder":
      return "Плечи";
    case "tricep":
      return "Трицепс";
    case "back":
      return "Спина";
    case "bicep":
      return "Бицепс";
    case "quadriceps":
      return "Квадрицепс";
    case "hamstrings":
      return "Бицепс бедра";
    case "calves":
      return "Икры";
    case "glutes":
      return "Ягодицы";
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