import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { MonthCalendar } from "@/components/month-calendar";
import { type ProgressData } from "@/services/fitness-service";
import { getStoredUserId } from "@/services/session-service";
import { getProgressOfflineFirst } from "@/services/progress-cache";
import { colors } from "./theme";

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function Progress() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData>({ workoutDates: [], weightHistory: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const currentMonthKey = getMonthKey(today);
  const workoutDays = progress.workoutDates.filter((date: string) => date.startsWith(currentMonthKey)).map((date: string) => Number(date.slice(-2)));

  // Backend returns months in ascending chronological order — preserve that order.
  const uniqueWeightHistory = Array.from(new Map(progress.weightHistory.map((item: { label: string; value: number }) => [item.label, item])).values());
  const maxWeightValue = Math.max(...uniqueWeightHistory.map((item: { label: string; value: number }) => item.value), 1);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      const userId = await getStoredUserId();

      if (!userId) {
        if (isMounted) {
          setError("Сначала создайте пользователя и завершите хотя бы одну тренировку.");
          setIsLoading(false);
        }
        return;
      }

      try {
        // Returns cached data (+ unsynced local workouts) immediately;
        // calls onFresh when the API responds.
        const cached = await getProgressOfflineFirst(userId, (fresh) => {
          if (isMounted) setProgress(fresh);
        });

        if (isMounted) {
          setProgress(cached);
          if (cached.workoutDates.length > 0 || cached.weightHistory.length > 0) {
            setIsLoading(false);
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить прогресс.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 26 }}>
          Статистика
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 4, marginBottom: 20 }}>
          Следите за своим прогрессом
        </Text>

        {isLoading ? <ActivityIndicator color={colors.accent} style={{ marginBottom: 18 }} /> : null}
        {error ? (
          <View style={{ backgroundColor: "#FF8A8022", padding: 12, borderRadius: 14, marginBottom: 18 }}>
            <Text style={{ color: "#FF8A80", textAlign: "center" }}>{error}</Text>
          </View>
        ) : null}

        <MonthCalendar date={today} variant="workout-days" workoutDays={workoutDays} showAdjacentDays />

        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginTop: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: `${colors.accent}22`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <MaterialIcons name="local-fire-department" size={28} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "700" }}>
                {workoutDays.length}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
                {workoutDays.length === 1 ? "тренировка в этом месяце" : "тренировок в этом месяце"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/workouts")}
            style={{
              marginTop: 16,
              backgroundColor: colors.accent,
              height: 48,
              borderRadius: 14,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
              Начать тренировку
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginTop: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 22 }}>
            <MaterialIcons name="monitor-weight" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Вес за 3 месяца</Text>
          </View>

          {uniqueWeightHistory.length > 0 ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              {uniqueWeightHistory.map((item) => {
                const barHeight = item.value > 0 ? Math.round((item.value / maxWeightValue) * 130) : 0;

                return (
                  <View key={item.label} style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
                      {item.value > 0 ? item.value : "—"}
                    </Text>
                    <View
                      style={{
                        width: 36,
                        height: Math.max(barHeight, 30),
                        borderRadius: 10,
                        backgroundColor: item.value > 0 ? colors.accent : colors.secondary,
                        marginBottom: 10,
                      }}
                    />
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500" }}>
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
              {isLoading ? "Загрузка..." : "Сервер пока не вернул историю веса."}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
