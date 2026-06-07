import {
  ActivityIndicator,
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
import { type WorkoutSummary } from "@/services/fitness-service";
import { getStoredUserId, setStoredWorkoutId } from "@/services/session-service";
import { getWorkoutsOfflineFirst } from "@/services/workout-cache";
import { colors } from "./theme";

const LIBRARY_CATEGORIES = [
  {
    title: "Бицепс",
    items: [
      {
        name: "Подъем штанги на бицепс",
        imageUri: "https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Сгибания с гантелями",
        imageUri: "https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Молотки стоя",
        imageUri: "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
  {
    title: "Трицепс",
    items: [
      {
        name: "Французский жим",
        imageUri: "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Разгибание на блоке",
        imageUri: "https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Отжимания узким хватом",
        imageUri: "https://images.pexels.com/photos/4761779/pexels-photo-4761779.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
  {
    title: "Грудь",
    items: [
      {
        name: "Жим лежа",
        imageUri: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Разводка с гантелями",
        imageUri: "https://images.pexels.com/photos/949129/pexels-photo-949129.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Отжимания на брусьях",
        imageUri: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
  {
    title: "Плечи",
    items: [
      {
        name: "Жим гантелей сидя",
        imageUri: "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Подъемы в стороны",
        imageUri: "https://images.pexels.com/photos/949132/pexels-photo-949132.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Тяга к подбородку",
        imageUri: "https://images.pexels.com/photos/5327534/pexels-photo-5327534.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
  {
    title: "Спина",
    items: [
      {
        name: "Подтягивания",
        imageUri: "https://images.pexels.com/photos/414029/pexels-photo-414029.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Тяга штанги в наклоне",
        imageUri: "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Тяга верхнего блока",
        imageUri: "https://images.pexels.com/photos/841131/pexels-photo-841131.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
  {
    title: "Ягодицы",
    items: [
      {
        name: "Ягодичный мост",
        imageUri: "https://images.pexels.com/photos/3757957/pexels-photo-3757957.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Выпады назад",
        imageUri: "https://images.pexels.com/photos/6456305/pexels-photo-6456305.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Румынская тяга",
        imageUri: "https://images.pexels.com/photos/6456217/pexels-photo-6456217.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
  {
    title: "Квадрицепс",
    items: [
      {
        name: "Приседания",
        imageUri: "https://images.pexels.com/photos/6456308/pexels-photo-6456308.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Жим ногами",
        imageUri: "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Болгарские выпады",
        imageUri: "https://images.pexels.com/photos/6456290/pexels-photo-6456290.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
  {
    title: "Бицепс бедра",
    items: [
      {
        name: "Сгибание ног лежа",
        imageUri: "https://images.pexels.com/photos/6456211/pexels-photo-6456211.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Good Morning",
        imageUri: "https://images.pexels.com/photos/6456226/pexels-photo-6456226.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Тяга на прямых ногах",
        imageUri: "https://images.pexels.com/photos/6456302/pexels-photo-6456302.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
  {
    title: "Пресс",
    items: [
      {
        name: "Скручивания",
        imageUri: "https://images.pexels.com/photos/6456143/pexels-photo-6456143.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Подъем ног в висе",
        imageUri: "https://images.pexels.com/photos/4164764/pexels-photo-4164764.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Планка",
        imageUri: "https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
];

export default function Workouts() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginBottom: 18 }}>
          Тренировки
        </Text>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 18 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
            Мой план тренировок:
          </Text>

          {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
          {error ? <Text style={{ color: "#FF8A80", marginBottom: 14 }}>{error}</Text> : null}

          {workouts.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => handleOpenWorkout(item.id)}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>{item.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
                  {item.goal}, {item.equipment}, {item.exercises.length} упражнений
                </Text>
              </View>

              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  overflow: "hidden",
                  backgroundColor: colors.secondary,
                }}
              >
                {item.exercises[0]?.imageUri ? <Image source={{ uri: item.exercises[0].imageUri }} style={{ width: "100%", height: "100%" }} /> : null}
              </View>
            </TouchableOpacity>
          ))}

          {!isLoading && workouts.length === 0 && !error ? (
            <Text style={{ color: colors.textSecondary, marginBottom: 14 }}>Сервер пока не вернул ни одного плана.</Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginLeft: 8 }}>
                Изменить
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => (primaryWorkout ? handleOpenWorkout(primaryWorkout.id) : router.push("/create-workout"))}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: colors.accent,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
                {primaryWorkout ? "Начать тренировку" : "Создать план"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/generate-week" } as any)}
              style={{ alignItems: "center", paddingVertical: 10, borderRadius: 12, backgroundColor: colors.secondary }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600" }}>Сгенерировать неделю</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 18 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 14 }}>
            Нужна новая тренировка?
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/create-workout")}
            style={{
              alignItems: "center",
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: colors.secondary,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600" }}>
              Создать план тренировок
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 18 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
            Библиотека упражнений
          </Text>

          {LIBRARY_CATEGORIES.map((category) => (
            <View key={category.title} style={{ marginBottom: 18 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                {category.title}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {category.items.map((exercise, idx) => (
                  <TouchableOpacity
                    key={`${category.title}-${idx}`}
                    activeOpacity={0.85}
                    onPress={() => handleOpenExercise(exercise.name, category.title, exercise.imageUri)}
                    style={{
                      width: 118,
                      borderRadius: 18,
                      backgroundColor: colors.secondary,
                      marginRight: 10,
                      overflow: "hidden",
                    }}
                  >
                    <Image source={{ uri: exercise.imageUri }} style={{ width: "100%", height: 84 }} />
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
