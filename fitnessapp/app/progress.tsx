import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { MonthCalendar } from "@/components/month-calendar";
import { getProgress, type ProgressData } from "@/services/fitness-service";
import { getStoredUserId } from "@/services/session-service";
import { colors } from "./theme";

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const MONTH_ORDER: Record<string, number> = {
  Янв: 0,
  Фев: 1,
  Мар: 2,
  Апр: 3,
  Май: 4,
  Июн: 5,
  Июл: 6,
  Авг: 7,
  Сен: 8,
  Окт: 9,
  Ноя: 10,
  Дек: 11,
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

export default function Progress() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData>({ workoutDates: [], weightHistory: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const currentMonthKey = getMonthKey(today);
  const workoutDays = progress.workoutDates.filter((date) => date.startsWith(currentMonthKey)).map((date) => Number(date.slice(-2)));
  
  // Deduplicate and get max value per month
  const uniqueWeightHistory = Array.from(new Map(progress.weightHistory.map((item) => [item.label, item])).values()).sort(
    (left, right) => (MONTH_ORDER[left.label] ?? Number.MAX_SAFE_INTEGER) - (MONTH_ORDER[right.label] ?? Number.MAX_SAFE_INTEGER),
  );
  
  const maxWeightValue = Math.max(...uniqueWeightHistory.map((item) => item.value), 1);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      try {
        const userId = await getStoredUserId();

        if (!userId) {
          if (isMounted) {
            setError("Сначала создайте пользователя и завершите хотя бы одну тренировку.");
          }
          return;
        }

        const loadedProgress = await getProgress(userId);

        if (isMounted) {
          setProgress(loadedProgress);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить прогресс.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginTop: 26, marginBottom: 18 }}>
          Статистика
        </Text>

        {isLoading ? <ActivityIndicator color={colors.accent} style={{ marginBottom: 18 }} /> : null}
        {error ? <Text style={{ color: "#FF8A80", marginBottom: 18 }}>{error}</Text> : null}

        <MonthCalendar date={today} variant="workout-days" workoutDays={workoutDays} showAdjacentDays fixedWeekRows />

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginTop: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, lineHeight: 22 }}>
            Вы посещали тренировки {workoutDays.length} раз за этот месяц
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/workouts")}
            style={{
              marginTop: 14,
              alignSelf: "center",
              backgroundColor: colors.accent,
              height: 44,
              borderRadius: 14,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>
              Начать тренировку
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginTop: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, marginBottom: 22 }}>Веса за 3 месяца</Text>

          {uniqueWeightHistory.length > 0 ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              {uniqueWeightHistory.map((item) => {
                const barHeight = item.value > 0 ? Math.round((item.value / maxWeightValue) * 130) : 0;

                return (
                  <View key={item.label} style={{ flex: 1, alignItems: "center" }}>
                    <View
                      style={{
                        width: 32,
                        height: Math.max(barHeight, 30),
                        borderRadius: 8,
                        backgroundColor: colors.accent,
                        marginBottom: 10,
                      }}
                    />
                    <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "500" }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                      {item.value > 0 ? item.value : "—"}
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
