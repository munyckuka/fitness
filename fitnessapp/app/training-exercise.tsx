import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "./theme";
import { getTipOfTheDay } from "@/services/tips-service";
import {
  getUserWorkouts,
  type CompleteWorkoutExerciseInput,
  type WorkoutSummary,
  type WorkoutExercise,
} from "@/services/fitness-service";
import { getCachedWorkouts, cacheWorkouts } from "@/services/workout-cache";
import { getCachedExerciseById } from "@/services/exercise-cache";
import {
  clearPendingWorkoutCompletion,
  getStoredUserId,
  getStoredWorkoutId,
  getWorkoutProgress,
  setPendingWorkoutCompletion,
  setStoredWorkoutId,
  setWorkoutProgress,
} from "@/services/session-service";

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export default function TrainingExercise() {
  const router = useRouter();
  const params = useLocalSearchParams<{ exercise?: string; workoutId?: string }>();
  const [workout, setWorkout] = useState<WorkoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const restTip = getTipOfTheDay({ screen: "training-exercise", placement: "rest-timer" });

  const rawIndex = Number(params.exercise ?? "0");
  const exercises = workout?.exercises ?? [];
  const currentIndex = Number.isFinite(rawIndex) ? Math.min(Math.max(rawIndex, 0), Math.max(exercises.length - 1, 0)) : 0;
  const currentExercise = exercises[currentIndex];
  const isLastExercise = currentIndex === exercises.length - 1;
  const setCount = currentExercise?.sets ?? 4;
  const repsPerSet = String(currentExercise?.reps ?? 8);
  const restSeconds = currentExercise?.restSeconds ?? 180;
  const weightLabel = typeof currentExercise?.weight === "number" ? `${currentExercise.weight} кг` : null;

  const [exerciseImageUri, setExerciseImageUri] = useState<string | null>(null);
  const [completedSets, setCompletedSets] = useState<boolean[]>(Array.from({ length: setCount }, () => false));
  const [completedSetsByExercise, setCompletedSetsByExercise] = useState<Record<string, boolean[]>>({});
  const [setQualitiesByExercise, setSetQualitiesByExercise] = useState<Record<string, (number | undefined)[]>>({});
  const [timerSeconds, setTimerSeconds] = useState<number>(restSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const applyWorkout = async (selectedWorkout: WorkoutSummary | null) => {
      if (!selectedWorkout || !isMounted) return;
      await setStoredWorkoutId(selectedWorkout.id);
      const storedProgress = await getWorkoutProgress(selectedWorkout.id);
      const progressByExercise = selectedWorkout.exercises.reduce<Record<string, boolean[]>>((acc, exercise) => {
        const existing = storedProgress?.[exercise.id] ?? [];
        acc[exercise.id] = Array.from({ length: exercise.sets }, (_, index) => Boolean(existing[index]));
        return acc;
      }, {});
      await setWorkoutProgress(selectedWorkout.id, progressByExercise);
      await clearPendingWorkoutCompletion();
      if (isMounted) {
        setWorkout(selectedWorkout);
        setCompletedSetsByExercise(progressByExercise);
      }
    };

    const loadWorkout = async () => {
      try {
        const userId = await getStoredUserId();
        const workoutId = params.workoutId ?? (await getStoredWorkoutId());

        if (!userId || !workoutId) {
          if (isMounted) setError("Тренировка не найдена. Сначала получите план.");
          return;
        }

        // Show cached data immediately — no spinner flash between exercises.
        const cached = await getCachedWorkouts(userId);
        const cachedWorkout = cached.find((w) => w.id === workoutId) ?? cached[0] ?? null;
        if (cachedWorkout) {
          await applyWorkout(cachedWorkout);
          if (isMounted) setIsLoading(false);
        }

        // Refresh from API in background; update state only if workout changed.
        try {
          const fresh = await getUserWorkouts(userId);
          // Cache fresh data (this also populates the exercises table with
          // photoPath/description so getCachedExerciseById works during training).
          void cacheWorkouts(userId, fresh);
          const freshWorkout = fresh.find((w) => w.id === workoutId) ?? fresh[0] ?? null;
          if (freshWorkout) await applyWorkout(freshWorkout);
          else if (!cachedWorkout && isMounted) setError("Тренировка не найдена. Сначала получите план.");
        } catch {
          if (!cachedWorkout && isMounted) setError("Не удалось загрузить тренировку.");
        }
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить упражнение.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadWorkout();
    return () => { isMounted = false; };
  }, [params.workoutId]);

  useEffect(() => {
    if (!currentExercise?.id) { setExerciseImageUri(null); return; }
    const uri = currentExercise.imageUri ?? null;
    if (uri) { setExerciseImageUri(uri); return; }
    getCachedExerciseById(currentExercise.id)
      .then((ex) => setExerciseImageUri(ex?.imageUri ?? null))
      .catch(() => setExerciseImageUri(null));
  }, [currentExercise?.id]);

  useEffect(() => {
    if (!currentExercise) {
      setCompletedSets(Array.from({ length: setCount }, () => false));
      return;
    }
    const currentProgress = completedSetsByExercise[currentExercise.id] ?? Array.from({ length: setCount }, () => false);
    setCompletedSets(currentProgress);
    const existingQualities = setQualitiesByExercise[currentExercise.id] ?? Array.from({ length: setCount }, () => undefined);
    setSetQualitiesByExercise((prev) => ({ ...prev, [currentExercise.id]: existingQualities }));
    setTimerSeconds(restSeconds);
    setIsTimerRunning(false);
  }, [completedSetsByExercise, currentExercise, currentIndex, restSeconds, setCount]);

  useEffect(() => {
    if (!isTimerRunning || timerSeconds <= 0) return;
    const id = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) { setIsTimerRunning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isTimerRunning, timerSeconds]);

  const toggleSet = (index: number) => {
    if (!workout || !currentExercise) return;
    setCompletedSets((prev) => {
      const next = prev.map((v, i) => (i === index ? !v : v));
      const nextProgress = { ...completedSetsByExercise, [currentExercise.id]: next };
      setCompletedSetsByExercise(nextProgress);
      void setWorkoutProgress(workout.id, nextProgress);
      setSetQualitiesByExercise((prevQ) => {
        const existing = prevQ[currentExercise.id] ?? Array.from({ length: setCount }, () => undefined);
        const nextQ = existing.slice();
        if (next[index] && nextQ[index] === undefined) nextQ[index] = 6;
        return { ...prevQ, [currentExercise.id]: nextQ };
      });
      return next;
    });
  };

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleTimerToggle = () => {
    if (timerSeconds === 0) { setTimerSeconds(restSeconds); setIsTimerRunning(true); return; }
    setIsTimerRunning((prev) => !prev);
  };

  const handleNext = () => {
    if (!workout || !currentExercise) return;
    const nextProgress = { ...completedSetsByExercise, [currentExercise.id]: completedSets };
    setCompletedSetsByExercise(nextProgress);
    void setWorkoutProgress(workout.id, nextProgress);
    if (isLastExercise) void finishWorkout(workout.id);
    else router.push(`/training-exercise?workoutId=${workout.id}&exercise=${currentIndex + 1}`);
  };

  const finishWorkout = async (workoutId: string) => {
    try {
      if (!workout) { setError("Тренировка не найдена."); return; }
      const progressMap = { ...completedSetsByExercise, [currentExercise?.id ?? ""]: completedSets };
      const exercisesPayload = workout.exercises
        .map((exercise: WorkoutExercise) => {
          const exerciseProgress = (progressMap[exercise.id] ?? []) as boolean[];
          const qualities = (setQualitiesByExercise[exercise.id] ?? []) as (number | undefined)[];
          const sets = exerciseProgress
            .map((done, idx) => ({ done, idx }))
            .filter(({ done }) => done)
            .map(({ idx }) => ({
              reps: exercise.reps,
              weight: typeof exercise.weight === "number" ? exercise.weight : 0,
              rpe: qualities[idx] ?? undefined,
            }));
          if (!isUUID(exercise.id) || sets.length === 0) return null;
          return { exerciseId: exercise.id, sets };
        })
        .filter((item): item is CompleteWorkoutExerciseInput => item !== null);

      await setWorkoutProgress(workout.id, progressMap);
      await setPendingWorkoutCompletion({ workoutId, exercises: exercisesPayload });
      router.push(`/training-feedback?workoutId=${workoutId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось завершить тренировку.");
    }
  };

  const doneCount = completedSets.filter(Boolean).length;

  const handleOpenInstructions = async () => {
    if (!currentExercise) return;
    const cached = await getCachedExerciseById(currentExercise.id);
    router.push({
      pathname: "/workout-exercise",
      params: {
        name: currentExercise.name,
        category: currentExercise.muscle ?? "",
        imageUri: cached?.imageUri ?? currentExercise.imageUri ?? "",
        description: cached?.description ?? currentExercise.description ?? "",
        fromTraining: "1",
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 35 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginRight: 12 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>
              {workout?.title ?? "Тренировка"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Упражнение {currentIndex + 1} из {exercises.length}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        {exercises.length > 0 ? (
          <View style={{ height: 4, backgroundColor: colors.secondary, borderRadius: 4, marginBottom: 20 }}>
            <View
              style={{
                height: 4,
                borderRadius: 4,
                backgroundColor: colors.accent,
                width: `${((currentIndex + 1) / exercises.length) * 100}%`,
              }}
            />
          </View>
        ) : null}

        {isLoading ? <ActivityIndicator color={colors.accent} style={{ marginBottom: 18 }} /> : null}
        {error ? (
          <View style={{ backgroundColor: "#FF8A8022", padding: 12, borderRadius: 14, marginBottom: 18 }}>
            <Text style={{ color: "#FF8A80", textAlign: "center" }}>{error}</Text>
          </View>
        ) : null}

        {/* Exercise card */}
        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: `${colors.accent}22`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              {exerciseImageUri ? (
                <Image
                  source={{ uri: exerciseImageUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <MaterialIcons name="fitness-center" size={28} color={colors.accent} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>
                {currentExercise?.name ?? "Упражнение"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }}>
                {currentExercise?.muscle ?? ""}
              </Text>
            </View>
          </View>

          {/* Chips */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.secondary }}>
              <MaterialIcons name="repeat" size={14} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{setCount} × {repsPerSet}</Text>
            </View>
            {weightLabel ? (
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.secondary }}>
                <MaterialIcons name="fitness-center" size={14} color={colors.accent} style={{ marginRight: 4 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{weightLabel}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.secondary }}>
              <MaterialIcons name="timer" size={14} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{restSeconds} с</Text>
            </View>
          </View>

          {/* Instructions button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenInstructions}
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: `${colors.accent}18`,
              borderWidth: 1,
              borderColor: `${colors.accent}33`,
              marginBottom: 18,
            }}
          >
            <MaterialIcons name="menu-book" size={14} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>Как делать</Text>
          </TouchableOpacity>

          {/* Sets */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600", flex: 1 }}>Подходы</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{doneCount} / {setCount}</Text>
          </View>

          {completedSets.map((isDone, idx) => (
            <View key={`set-${idx}`} style={{ marginBottom: 10 }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => toggleSet(idx)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: isDone ? `${colors.accent}18` : colors.secondary,
                  borderWidth: 1,
                  borderColor: isDone ? `${colors.accent}44` : "transparent",
                }}
              >
                <MaterialIcons
                  name={isDone ? "check-circle" : "radio-button-unchecked"}
                  size={22}
                  color={isDone ? colors.accent : colors.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: isDone ? colors.textPrimary : colors.textSecondary, fontSize: 15, fontWeight: "600", flex: 1 }}>
                  Подход {idx + 1}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {repsPerSet} повт.{weightLabel ? `  ·  ${weightLabel}` : ""}
                </Text>
              </TouchableOpacity>

              {isDone ? (
                <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6 }}>(насколько тяжело, 1–10):
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {Array.from({ length: 10 }).map((_, vIdx) => {
                        const value = vIdx + 1;
                        const qualities = setQualitiesByExercise[currentExercise?.id ?? ""] ?? [];
                        const selected = qualities[idx] === value;
                        return (
                          <TouchableOpacity
                            key={value}
                            activeOpacity={0.8}
                            onPress={() =>
                              setSetQualitiesByExercise((prev) => {
                                const existing = prev[currentExercise?.id ?? ""] ?? Array.from({ length: setCount }, () => undefined);
                                const next = existing.slice();
                                next[idx] = value;
                                return { ...prev, [currentExercise?.id ?? ""]: next };
                              })
                            }
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: selected ? colors.accent : colors.secondary,
                              borderWidth: selected ? 2 : 0,
                              borderColor: selected ? "rgba(255,255,255,0.35)" : "transparent",
                            }}
                          >
                            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>{value}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* Rest timer */}
        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: `${colors.accent}22`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <MaterialIcons name="timer" size={20} color={colors.accent} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Таймер отдыха</Text>
          </View>

          <Text style={{ color: colors.textPrimary, fontSize: 48, fontWeight: "700", textAlign: "center", marginBottom: 16, letterSpacing: 2 }}>
            {formatTimer(timerSeconds)}
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { setIsTimerRunning(false); setTimerSeconds(restSeconds); }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                backgroundColor: colors.secondary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>Сброс</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTimerToggle}
              style={{
                flex: 2,
                height: 44,
                borderRadius: 12,
                backgroundColor: colors.accent,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons
                name={isTimerRunning ? "pause" : "play-arrow"}
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                {isTimerRunning ? "Пауза" : timerSeconds === 0 ? "Повторить" : "Старт"}
              </Text>
            </TouchableOpacity>
          </View>

          {restTip ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 12, lineHeight: 18 }}>
              {restTip.text}
            </Text>
          ) : null}
        </View>

        {/* Navigation */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 16,
              backgroundColor: colors.secondary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            style={{
              flex: 3,
              height: 52,
              borderRadius: 16,
              backgroundColor: colors.accent,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginRight: 6 }}>
              {isLastExercise ? "Завершить тренировку" : "Следующее упражнение"}
            </Text>
            <MaterialIcons name={isLastExercise ? "check" : "arrow-forward"} size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
