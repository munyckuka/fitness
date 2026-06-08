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
            </TouchableOpacity>
          ))}

          {!isLoading && workouts.length === 0 && !error ? (
            <Text style={{ color: colors.textSecondary, marginBottom: 14 }}>Сервер пока не вернул ни одного плана.</Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: colors.secondary,
              }}
            >
              <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginLeft: 8, fontWeight: "600" }}>
                Изменить
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => (primaryWorkout ? handleOpenWorkout(primaryWorkout.id) : router.push("/create-workout"))}
              style={{
                flex: 1,
                flexDirection: "row",
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: colors.accent,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons name={primaryWorkout ? "play-arrow" : "add"} size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                {primaryWorkout ? "Начать" : "Создать"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/generate-week" } as any)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.secondary }}
          >
            <MaterialIcons name="auto-awesome" size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600" }}>Сгенерировать неделю</Text>
          </TouchableOpacity>
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

          {LIBRARY_CATEGORIES.map((category) => (
            <View key={category.title} style={{ marginBottom: 18 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600", marginBottom: 12 }}>
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
