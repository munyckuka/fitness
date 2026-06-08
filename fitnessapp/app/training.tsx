import { useCallback, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getUserWorkouts, type WorkoutSummary, type WorkoutExercise } from "@/services/fitness-service";
import { getStoredUserId, getStoredWorkoutId, setStoredWorkoutId } from "@/services/session-service";
import { colors } from "./theme";

const SPLIT_LABEL: Record<string, string> = {
  push: "Толчок",
  pull: "Тяга",
  legs: "Ноги",
  upper: "Верх",
  lower: "Низ",
  fullbody: "Всё тело",
};

export default function Training() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawWorkoutId = params.workoutId;
  const paramWorkoutId = Array.isArray(rawWorkoutId) ? rawWorkoutId[0] : rawWorkoutId;
  const [workout, setWorkout] = useState<WorkoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadWorkout = async () => {
        setIsLoading(true);
        try {
          const userId = await getStoredUserId();
          const workoutId = paramWorkoutId ?? (await getStoredWorkoutId());

          if (!userId || !workoutId) {
            if (isMounted) setError("Сначала получите план тренировки.");
            return;
          }

          const workouts = await getUserWorkouts(userId);
          const selectedWorkout = workouts.find((item) => item.id === workoutId) ?? workouts[0] ?? null;

          if (selectedWorkout) await setStoredWorkoutId(selectedWorkout.id);
          if (isMounted) setWorkout(selectedWorkout);
        } catch (loadError) {
          if (isMounted) setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить тренировку.");
        } finally {
          if (isMounted) setIsLoading(false);
        }
      };

      void loadWorkout();
      return () => { isMounted = false; };
    }, [paramWorkoutId]),
  );

  const exercises = (workout?.exercises ?? []) as WorkoutExercise[];
  const splitLabel = workout?.splitPart ? (SPLIT_LABEL[workout.splitPart] ?? workout.splitPart) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginBottom: 16, alignSelf: "flex-start" }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 6 }}>
          {workout?.title ?? "Тренировка"}
        </Text>
        {splitLabel ? (
          <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 4, marginBottom: 20 }}>
            {splitLabel}
          </Text>
        ) : (
          <View style={{ marginBottom: 20 }} />
        )}

        {isLoading ? <ActivityIndicator color={colors.accent} style={{ marginBottom: 18 }} /> : null}
        {error ? (
          <View style={{ backgroundColor: "#FF8A8022", padding: 12, borderRadius: 14, marginBottom: 18 }}>
            <Text style={{ color: "#FF8A80", textAlign: "center" }}>{error}</Text>
          </View>
        ) : null}

        {workout ? (
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {[
              { icon: "flag" as const, label: workout.goal ?? "-" },
              { icon: "fitness-center" as const, label: workout.equipment ?? "-" },
              { icon: "timer" as const, label: `${workout.durationMinutes ?? 0} мин` },
            ].map((chip) => (
              <View
                key={chip.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: colors.thirdary,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.05)",
                }}
              >
                <MaterialIcons name={chip.icon} size={14} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500" }}>{chip.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <MaterialIcons name="format-list-bulleted" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>
              Упражнения · {exercises.length}
            </Text>
          </View>

          {exercises.map((exercise, idx) => (
            <TouchableOpacity
              key={exercise.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/training-exercise?workoutId=${workout?.id ?? ""}&exercise=${idx}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: "rgba(255,255,255,0.05)",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: `${colors.accent}22`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 16, fontWeight: "700" }}>{idx + 1}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "600" }}>{exercise.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }}>{exercise.muscle}</Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {exercise.sets} × {exercise.reps}
                  </Text>
                  {typeof exercise.weight === "number" ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{exercise.weight} кг</Text>
                  ) : null}
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{exercise.restSeconds} с отдыха</Text>
                </View>
              </View>

              <View style={{ flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push({ pathname: "/replace-exercise", params: { workoutId: workout?.id ?? "", exerciseId: exercise.id } } as any);
                  }}
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Заменить</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {!isLoading && exercises.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>Упражнения не загружены.</Text>
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => (workout ? router.push(`/pre-workout?workoutId=${workout.id}`) : router.push("/create-workout"))}
          style={{
            height: 52,
            borderRadius: 16,
            backgroundColor: colors.accent,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialIcons name={workout ? "play-arrow" : "add"} size={22} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
            {workout ? "Начать тренировку" : "Создать план"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
