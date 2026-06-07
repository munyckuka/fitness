import { useEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "./theme";
import { MonthCalendar } from "../components/month-calendar";
import { getTipOfTheDay } from "@/services/tips-service";
import { type UserProfile, type WorkoutSummary } from "@/services/fitness-service";
import { getStoredUserId, setStoredWorkoutId } from "@/services/session-service";
import { getProfileOfflineFirst } from "@/services/profile-cache";
import { getWorkoutsOfflineFirst } from "@/services/workout-cache";
import { getProgressOfflineFirst } from "@/services/progress-cache";

const MONTH_NAMES_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function Index() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workout, setWorkout] = useState<WorkoutSummary | null>(null);
  const [workoutDays, setWorkoutDays] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const monthIndex = today.getMonth();
  const dayOfMonth = today.getDate();

  const monthLabelGenitive = MONTH_NAMES_GENITIVE[monthIndex];
  const goalsTip = getTipOfTheDay({ screen: "index", placement: "goals-card" }, today);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const userId = await getStoredUserId();

      if (!userId) {
        if (isMounted) router.replace("/welcome");
        return;
      }

      const currentMonthKey = getMonthKey(today);

      const applyWorkoutDays = (dates: string[]) => {
        const days = dates
          .filter((d) => d.startsWith(currentMonthKey))
          .map((d) => Number(d.slice(-2)));
        if (isMounted) setWorkoutDays(days);
      };

      try {
        // All three load from cache immediately; API updates arrive via callbacks.
        const [cachedUser, cachedWorkouts, cachedProgress] = await Promise.all([
          getProfileOfflineFirst(userId, (fresh) => { if (isMounted) setUser(fresh); }),
          getWorkoutsOfflineFirst(userId, (fresh) => { if (isMounted) setWorkout(fresh[0] ?? null); }),
          getProgressOfflineFirst(userId, (fresh) => applyWorkoutDays(fresh.workoutDates)),
        ]);

        if (!isMounted) return;

        if (cachedUser) setUser(cachedUser);
        setWorkout(cachedWorkouts[0] ?? null);
        applyWorkoutDays(cachedProgress.workoutDates);

        // Keep spinner only on first launch when all caches are empty.
        if (cachedUser || cachedWorkouts.length > 0) setIsLoading(false);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить данные с сервера.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartWorkout = async () => {
    if (!workout) {
      router.push("/create-workout");
      return;
    }

    await setStoredWorkoutId(workout.id);
    router.push(`/training?workoutId=${workout.id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.thirdary,
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              marginRight: 14,
            }}
          >
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80" }}
              style={{ width: "100%", height: "100%" }}
            />
          </View>

          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "700" }}>
              Привет, {user?.name ?? "спортсмен"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
              Приготовьтесь!
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/workouts")}
          style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 16 }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>
            Что тренировать сегодня?
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
                {workout?.title ?? "План пока не создан"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {isLoading ? "Загрузка..." : `${dayOfMonth} ${monthLabelGenitive}`}
              </Text>
            </View>

            <View
              style={{
                width: 66,
                height: 66,
                borderRadius: 18,
                backgroundColor: colors.thirdary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 32 }}>💪</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 18 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 10 }}>
            Ставьте конкретные цели:
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
            {goalsTip?.text ?? "Определите, чего хотите достичь (похудеть, набрать массу, выносливость)."}
          </Text>

          {error ? <Text style={{ color: "#FF8A80", fontSize: 14, marginBottom: 12 }}>{error}</Text> : null}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleStartWorkout}
            style={{
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.accent,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>
                {workout ? "Начать тренировку" : "Создать план"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <MonthCalendar date={today} selectedDay={dayOfMonth} variant="workout-days" workoutDays={workoutDays} showAdjacentDays fixedWeekRows />
      </ScrollView>

    </SafeAreaView>
  );
}
