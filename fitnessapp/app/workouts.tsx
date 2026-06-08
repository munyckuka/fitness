import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { deleteWorkout, type WorkoutSummary, type ExerciseSearchResult } from "@/services/fitness-service";
import { getStoredUserId, setStoredWorkoutId } from "@/services/session-service";
import { getWorkoutsOfflineFirst } from "@/services/workout-cache";
import { searchExercisesOfflineFirst } from "@/services/exercise-cache";
import { colors } from "./theme";

const MUSCLE_ORDER = ["chest", "back", "shoulder", "bicep", "tricep", "legs", "glutes", "calves", "core", "full body"];
const MUSCLE_LABEL: Record<string, string> = {
  chest: "Грудь", back: "Спина", shoulder: "Плечи", bicep: "Бицепс",
  tricep: "Трицепс", legs: "Ноги", glutes: "Ягодицы", calves: "Икры",
  core: "Пресс", "full body": "Всё тело",
};

type LibraryCategory = { muscle: string; title: string; items: ExerciseSearchResult[] };


export default function Workouts() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryCategory[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);

  // Load library from API, fall back to placeholder if unavailable
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const all = await searchExercisesOfflineFirst(undefined, undefined, 1000);
        if (!isMounted) return;
        const grouped: Record<string, ExerciseSearchResult[]> = {};
        for (const ex of all) {
          const key = ex.muscleGroup ?? "full body";
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(ex);
        }
        const categories: LibraryCategory[] = MUSCLE_ORDER
          .filter((m) => grouped[m] && grouped[m].length > 0)
          .map((m) => ({ muscle: m, title: MUSCLE_LABEL[m] ?? m, items: grouped[m] }));
        if (isMounted) setLibrary(categories);
      } catch {
        // keep placeholder visible — no state change needed
      } finally {
        if (isMounted) setIsLibraryLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadWorkouts = async () => {
      const userId = await getStoredUserId();

      if (!userId) {
        if (isMounted) {
          setError("Сначала создайте профиль и план тренировки.");
          setIsLoading(false);
        }
        return;
      }

      try {
        // Returns cached data immediately; calls onFresh when API responds.
        const cached = await getWorkoutsOfflineFirst(userId, (fresh) => {
          if (isMounted) setWorkouts(fresh);
        });

        if (isMounted) {
          setWorkouts(cached);
          // Only keep spinner if cache is empty (first launch or cleared).
          if (cached.length > 0) setIsLoading(false);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить тренировки.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadWorkouts();

    return () => {
      isMounted = false;
    };
  }, []);

  const primaryWorkout = workouts[0] ?? null;

  const handleOpenWorkout = async (workoutId: string) => {
    await setStoredWorkoutId(workoutId);
    router.push(`/training?workoutId=${workoutId}`);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert(
      "Удалить тренировку?",
      "Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            const userId = await getStoredUserId();
            if (!userId) return;
            try {
              await deleteWorkout(userId, workoutId);
              setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
            } catch {
              Alert.alert("Ошибка", "Не удалось удалить тренировку.");
            }
          },
        },
      ],
    );
  };

  const handleOpenExercise = (exerciseName: string, categoryTitle: string, imageUri: string) => {
    router.push({
      pathname: "/workout-exercise",
      params: {
        name: exerciseName,
        category: categoryTitle,
        imageUri,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 6 }}>
          Тренировки
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 4, marginBottom: 20 }}>
          Ваши планы и библиотека упражнений
        </Text>

        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <MaterialIcons name="assignment" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Мой план тренировок</Text>
          </View>

          {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
          {error ? (
            <View style={{ backgroundColor: "#FF8A8022", padding: 10, borderRadius: 12, marginBottom: 14 }}>
              <Text style={{ color: "#FF8A80", textAlign: "center" }}>{error}</Text>
            </View>
          ) : null}

          {workouts.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => handleOpenWorkout(item.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                borderTopWidth: index === 0 ? 0 : 1,
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
                <MaterialIcons name="fitness-center" size={24} color={colors.accent} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700" }}>{item.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }} numberOfLines={1}>
                  {item.goal}, {item.equipment}, {item.exercises.length} упражнений
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); handleDeleteWorkout(item.id); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(255,90,90,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>

                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="play-arrow" size={22} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {!isLoading && workouts.length === 0 && !error ? (
            <Text style={{ color: colors.textSecondary, marginBottom: 14 }}>Сервер пока не вернул ни одного плана.</Text>
          ) : null}


        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/create-workout")}
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
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
            <MaterialIcons name="add" size={26} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Новая тренировка</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Создать свой план с нуля</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <MaterialIcons name="menu-book" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Библиотека упражнений</Text>
          </View>

          {isLibraryLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
          ) : null}

          {library.map((category) => (
            <View key={category.muscle} style={{ marginBottom: 18 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600", marginBottom: 12 }}>
                {category.title}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {category.items.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    activeOpacity={0.85}
                    onPress={() => handleOpenExercise(exercise.name, category.title, exercise.imageUri ?? "")}
                    style={{
                      width: 118,
                      borderRadius: 18,
                      backgroundColor: colors.secondary,
                      marginRight: 10,
                      overflow: "hidden",
                    }}
                  >
                    {exercise.imageUri ? (
                      <Image source={{ uri: exercise.imageUri }} style={{ width: "100%", height: 84 }} />
                    ) : (
                      <View style={{ width: "100%", height: 84, backgroundColor: `${colors.accent}22`, justifyContent: "center", alignItems: "center" }}>
                        <MaterialIcons name="fitness-center" size={32} color={colors.accent} />
                      </View>
                    )}
                    <View style={{ paddingHorizontal: 10, paddingVertical: 10, minHeight: 64, justifyContent: "center" }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>{exercise.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
