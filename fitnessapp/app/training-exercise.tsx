import { useEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
import {
  clearPendingWorkoutCompletion,
  getStoredUserId,
  getStoredWorkoutId,
  getWorkoutProgress,
  setPendingWorkoutCompletion,
  setStoredWorkoutId,
  setWorkoutProgress,
} from "@/services/session-service";

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
  const [completedSets, setCompletedSets] = useState<boolean[]>(Array.from({ length: setCount }, () => false));
  const [completedSetsByExercise, setCompletedSetsByExercise] = useState<Record<string, boolean[]>>({});
  const [setQualitiesByExercise, setSetQualitiesByExercise] = useState<Record<string, (number | undefined)[]>>({});
  const [timerSeconds, setTimerSeconds] = useState<number>(restSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadWorkout = async () => {
      try {
        const userId = await getStoredUserId();
        const workoutId = params.workoutId ?? (await getStoredWorkoutId());

        if (!userId || !workoutId) {
          if (isMounted) {
            setError("Тренировка не найдена. Сначала получите план.");
          }
          return;
        }

        const workouts = await getUserWorkouts(userId);
        const selectedWorkout = workouts.find((item) => item.id === workoutId) ?? workouts[0] ?? null;

        if (selectedWorkout) {
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
            setCompletedSetsByExercise(progressByExercise);
          }
        }

        if (isMounted) {
          setWorkout(selectedWorkout);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить упражнение.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWorkout();

    return () => {
      isMounted = false;
    };
  }, [params.workoutId]);

  useEffect(() => {
    if (!currentExercise) {
      setCompletedSets(Array.from({ length: setCount }, () => false));
      return;
    }

    const currentProgress = completedSetsByExercise[currentExercise.id] ?? Array.from({ length: setCount }, () => false);
    setCompletedSets(currentProgress);
    const existingQualities = setQualitiesByExercise[currentExercise.id] ?? Array.from({ length: setCount }, () => undefined);
    setSetQualitiesByExercise((prev: Record<string, (number | undefined)[]>) => ({ ...prev, [currentExercise.id]: existingQualities }));
    setTimerSeconds(restSeconds);
    setIsTimerRunning(false);
  }, [completedSetsByExercise, currentExercise, currentIndex, restSeconds, setCount]);

  useEffect(() => {
    if (!isTimerRunning || timerSeconds <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimerSeconds((prev: number) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isTimerRunning, timerSeconds]);

  const toggleSet = (index: number) => {
    if (!workout || !currentExercise) {
      return;
    }

    setCompletedSets((prev: boolean[]) => {
      const next = prev.map((value, idx) => (idx === index ? !value : value));
      const nextProgress = {
        ...completedSetsByExercise,
        [currentExercise.id]: next,
      };

      setCompletedSetsByExercise(nextProgress);
      void setWorkoutProgress(workout.id, nextProgress);

      // initialize quality for this set if it was just completed
        setSetQualitiesByExercise((prev: Record<string, (number | undefined)[]>) => {
            const existing = prev[currentExercise.id] ?? Array.from({ length: setCount }, () => undefined);
        const nextQualities = existing.slice();
        if (next[index] && nextQualities[index] === undefined) {
          nextQualities[index] = 6; // default rpe
        }
        return { ...prev, [currentExercise.id]: nextQualities };
      });

      return next;
    });
  };

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleTimerToggle = () => {
    if (timerSeconds === 0) {
      setTimerSeconds(restSeconds);
      setIsTimerRunning(true);
      return;
    }

    setIsTimerRunning((prev: boolean) => !prev);
  };

  const handleTimerReset = () => {
    setIsTimerRunning(false);
    setTimerSeconds(restSeconds);
  };

  const handleNext = () => {
    if (!workout || !currentExercise) {
      return;
    }

    const nextProgress = {
      ...completedSetsByExercise,
      [currentExercise.id]: completedSets,
    };

    setCompletedSetsByExercise(nextProgress);
    void setWorkoutProgress(workout.id, nextProgress);

    if (isLastExercise) {
      void finishWorkout(workout.id);
    } else {
      router.push(`/training-exercise?workoutId=${workout.id}&exercise=${currentIndex + 1}`);
    }
  };

  const finishWorkout = async (workoutId: string) => {
    try {
      if (!workout) {
        setError("Тренировка не найдена.");
        return;
      }

      const progressMap = {
        ...completedSetsByExercise,
        [currentExercise?.id ?? ""]: completedSets,
      };

      const exercisesPayload = workout.exercises
          .map((exercise: WorkoutExercise) => {
               const exerciseProgress = (progressMap[exercise.id] ?? []) as boolean[];
               const qualities = (setQualitiesByExercise[exercise.id] ?? []) as (number | undefined)[];

               const sets = exerciseProgress
                 .map((done: boolean, idx: number) => ({ done, idx }))
                 .filter((item: { done: boolean; idx: number }) => item.done)
                 .map((item: { done: boolean; idx: number }) => ({
                   reps: exercise.reps,
                   weight: typeof exercise.weight === "number" ? exercise.weight : 0,
                   rpe: qualities[item.idx] ?? undefined,
                 }));

          if (!isUUID(exercise.id) || sets.length === 0) {
            return null;
          }

          return {
            exercise_id: exercise.id,
            sets,
          };
        })
        .filter((item: CompleteWorkoutExerciseInput | null): item is CompleteWorkoutExerciseInput => item !== null);

      await setWorkoutProgress(workout.id, progressMap);
      await setPendingWorkoutCompletion({
        workoutId,
        exercises: exercisesPayload as CompleteWorkoutExerciseInput[],
      });

      router.push(`/training-feedback?workoutId=${workoutId}`);
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : "Не удалось завершить тренировку.");
    }
  };

  const isUUID = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.textPrimary, fontSize: 20, lineHeight: 50, fontWeight: "500", marginBottom: 20 }}>
          Тренировка
        </Text>

        {isLoading ? <ActivityIndicator color={colors.accent} style={{ marginBottom: 18 }} /> : null}
        {error ? <Text style={{ color: "#FF8A80", marginBottom: 18 }}>{error}</Text> : null}

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 18 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "500", marginBottom: 14 }}>
            {workout?.title ?? "План тренировки"}
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 18, marginBottom: 4 }}>Цель:</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 18, marginBottom: 14 }}>{workout?.goal ?? "-"}</Text>

              <Text style={{ color: colors.textSecondary, fontSize: 18, marginBottom: 4 }}>Снаряжение:</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 18 }}>{workout?.equipment ?? "-"}</Text>
            </View>

            <View style={{ flex: 1, paddingLeft: 12 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 18, marginBottom: 4 }}>Уровень:</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 18, marginBottom: 14 }}>{workout?.level ?? "-"}</Text>

              <Text style={{ color: colors.textSecondary, fontSize: 18, marginBottom: 4 }}>Длительность:</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 18 }}>{workout?.durationMinutes ?? 0} мин.</Text>
            </View>
          </View>
        </View>

        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "500", marginBottom: 12 }}>
          Упражнение:
        </Text>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#ECECEC",
                marginRight: 14,
              }}
            >
              {currentExercise?.imageUri ? <Image source={{ uri: currentExercise.imageUri }} style={{ width: "100%", height: "100%" }} /> : null}
            </View>

            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 22, lineHeight: 28, fontWeight: "500" }}>
                {currentIndex + 1}. {currentExercise?.name ?? "Упражнение"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>{currentExercise?.muscle ?? "Группа мышц"}</Text>
            </View>

            <View style={{ alignItems: "flex-start" }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "500" }}>{currentExercise?.sets ?? 0} × {currentExercise?.reps ?? 0}</Text>
              {weightLabel ? <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>{weightLabel}</Text> : null}
              <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>{currentExercise?.restSeconds ?? 0} сек. отдыха</Text>
            </View>
          </View>

          {completedSets.map((isDone: boolean, idx: number) => (
            <View key={`set-${idx}`} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => toggleSet(idx)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons
                    name={isDone ? "check-box" : "check-box-outline-blank"}
                    size={30}
                    color={isDone ? colors.accent : colors.textPrimary}
                  />
                  <Text style={{ color: colors.textPrimary, fontSize: 18, marginLeft: 12 }}>
                    Подход {idx + 1}: {repsPerSet} повторений
                  </Text>
                </View>

              </TouchableOpacity>

              {isDone ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {Array.from({ length: 10 }).map((_, vIdx) => {
                      const value = vIdx + 1;
                      const qualities = setQualitiesByExercise[currentExercise?.id ?? ""] ?? [];
                      const selected = qualities[idx] === value;
                      return (
                        <TouchableOpacity
                          key={`q-${idx}-${value}`}
                          onPress={() =>
                            setSetQualitiesByExercise((prev: Record<string, (number | undefined)[]>) => {
                              const existing = prev[currentExercise?.id ?? ""] ?? Array.from({ length: setCount }, () => undefined);
                              const next = existing.slice();
                              next[idx] = value;
                              return { ...prev, [currentExercise?.id ?? ""]: next };
                            })
                          }
                          style={{
                            minWidth: 36,
                            height: 36,
                            borderRadius: 8,
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 6,
                            backgroundColor: selected ? colors.accent : colors.secondary,
                          }}
                        >
                          <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{value}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : null}
            </View>
          ))}

          <View style={{ marginTop: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 8 }}>
              Таймер отдыха
            </Text>

            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginBottom: 10, textAlign: "center" }}>
              {formatTimer(timerSeconds)}
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleTimerReset}
                style={{
                  flex: 1,
                  paddingVertical: 10,
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
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.accent,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
                  {isTimerRunning ? "Пауза" : timerSeconds === 0 ? "Повторить" : "Старт"}
                </Text>
              </TouchableOpacity>

              
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 10 }}>
              {restTip?.text ?? "Важно отдыхать. Восстановите дыхание между подходами."}
            </Text>
          </View>
        </View>

        <Text style={{ color: colors.textSecondary, fontSize: 18, marginBottom: 20 }}>
          Старайтесь делать на отказ
        </Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: colors.secondary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>
              Назад
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            style={{
              flex: 1.9,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: colors.accent,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
              {isLastExercise ? "Закончить" : "Следующее упражнение"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
