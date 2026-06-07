import { useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { completeWorkoutOfflineFirst } from "@/services/offline-workout";
import {
  clearPendingWorkoutCompletion,
  clearWorkoutProgress,
  getPendingWorkoutCompletion,
  getStoredUserId,
  getRecoveryMetrics,
  clearRecoveryMetrics,
} from "@/services/session-service";
import { colors } from "./theme";

const SCALE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function TrainingFeedback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawWorkoutId = params.workoutId;
  const paramWorkoutId = Array.isArray(rawWorkoutId) ? rawWorkoutId[0] : rawWorkoutId;
  const [difficulty, setDifficulty] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hint = useMemo(() => {
    if (difficulty <= 2) {
      return "1: не могу поднять веса";
    }
    if (difficulty <= 4) {
      return "4: тяжело, надо больше времени на отдых или уменьшить повторения";
    }
    if (difficulty < 6) {
      return "5: на следующей тренировке сделаю столько же";
    }
    if (difficulty < 8) {
      return "7: легко, можно увеличить повторения ";
    }

    return "10: легко, можно увеличить веса";
  }, [difficulty]);

  const handleFinish = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      const userId = await getStoredUserId();
      const pending = await getPendingWorkoutCompletion();
      const workoutId = paramWorkoutId ?? pending?.workoutId;

      if (!userId || !workoutId || !pending) {
        setError("Не удалось завершить тренировку: отсутствуют данные сессии.");
        return;
      }

      const recovery = await getRecoveryMetrics();

      // Saves locally first, syncs in background — works offline.
      await completeWorkoutOfflineFirst({
        userId,
        workoutId,
        difficulty,
        exercises: pending.exercises,
        recovery: recovery ?? undefined,
      });

      await clearPendingWorkoutCompletion();
      await clearWorkoutProgress();
      await clearRecoveryMetrics();
      router.replace("/progress");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось завершить тренировку.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 24, lineHeight: 32, fontWeight: "600", marginBottom: 18 }}>
          Укажите насколько было сложно/легко выполнить тренировку
        </Text>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>Шкала сложности</Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {SCALE_VALUES.map((value) => {
              const selected = value === difficulty;
              return (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.85}
                  onPress={() => setDifficulty(value)}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: selected ? colors.accent : colors.secondary,
                    borderWidth: selected ? 2 : 0,
                    borderColor: selected ? "rgba(255,255,255,0.35)" : "transparent",
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>{value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 14 }}>{hint}</Text>
        </View>

        {error ? <Text style={{ color: "#FF8A80", marginBottom: 14 }}>{error}</Text> : null}
        {isSubmitting ? <ActivityIndicator color={colors.accent} style={{ marginBottom: 14 }} /> : null}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => void handleFinish()}
          disabled={isSubmitting}
          style={{
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.accent,
            justifyContent: "center",
            alignItems: "center",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Закончить тренировку</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
