import { useEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getUserWorkouts, type WorkoutSummary } from "@/services/fitness-service";
import { getStoredUserId, getStoredWorkoutId, setStoredWorkoutId } from "@/services/session-service";
import { colors } from "./theme";

export default function Training() {
  const router = useRouter();
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const [workout, setWorkout] = useState<WorkoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadWorkout = async () => {
      try {
        const userId = await getStoredUserId();
        const workoutId = params.workoutId ?? (await getStoredWorkoutId());

        if (!userId || !workoutId) {
          if (isMounted) {
            setError("Сначала получите план тренировки.");
          }
          return;
        }

        const workouts = await getUserWorkouts(userId);
        const selectedWorkout = workouts.find((item) => item.id === workoutId) ?? workouts[0] ?? null;

        if (selectedWorkout) {
          await setStoredWorkoutId(selectedWorkout.id);
        }

        if (isMounted) {
          setWorkout(selectedWorkout);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить тренировку.");
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

  const exercises = workout?.exercises ?? [];

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
          Упражнения:
        </Text>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 20 }}>
          {exercises.map((exercise, idx) => (
            <TouchableOpacity
              key={exercise.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/training-exercise?workoutId=${workout?.id ?? ""}&exercise=${idx}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: idx === exercises.length - 1 ? 0 : 14,
              }}
            >
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
                {exercise.imageUri ? <Image source={{ uri: exercise.imageUri }} style={{ width: "100%", height: "100%" }} /> : null}
              </View>

              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 22, lineHeight: 28, fontWeight: "500" }}>
                  {idx + 1}. {exercise.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>{exercise.muscle}</Text>
              </View>

              <View style={{ alignItems: "flex-start" }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "500" }}>{exercise.sets} × {exercise.reps}</Text>
                {typeof exercise.weight === "number" ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>{exercise.weight} кг</Text>
                ) : null}
                <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>{exercise.restSeconds} сек. отдыха</Text>
              </View>
            </TouchableOpacity>
          ))}

          {!isLoading && exercises.length === 0 ? <Text style={{ color: colors.textSecondary }}>Упражнения пока не получены.</Text> : null}
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: colors.secondary,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginRight: 8 }}>
              Изменить
            </Text>
            <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => (workout ? router.push(`/training-exercise?workoutId=${workout.id}&exercise=0`) : router.push("/create-workout"))}
            style={{
              flex: 1.55,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: colors.accent,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
              {workout ? "Начать тренировку" : "Создать план"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
