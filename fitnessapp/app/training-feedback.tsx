import { useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
    if (difficulty <= 2) return "1–2: очень легко, можно увеличить веса";
    if (difficulty <= 4) return "3–4: комфортно, можно добавить повторения";
    if (difficulty <= 6) return "5–6: умеренно, оставлю так же";
    if (difficulty <= 8) return "7–8: тяжело, нужно больше отдыха";
    return "9–10: очень тяжело, уменьшу вес или повторения";
  }, [difficulty]);

  const difficultyColor = useMemo(() => {
    if (difficulty <= 3) return "#8EE08E";
    if (difficulty <= 6) return "#FFD166";
    return "#FF8A80";
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
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 6 }}>
          Как прошла тренировка?
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 4, marginBottom: 24 }}>
          Оцените сложность от 1 до 10
        </Text>

        {/* Big difficulty display */}
        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 24,
            marginBottom: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <Text style={{ color: difficultyColor, fontSize: 72, fontWeight: "700", lineHeight: 80 }}>
            {difficulty}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: "center" }}>
            {hint}
          </Text>
        </View>

        {/* Scale buttons */}
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
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <MaterialIcons name="speed" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Шкала сложности</Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Легко</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Тяжело</Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
        </View>

        {error ? (
          <View style={{ backgroundColor: "#FF8A8022", padding: 12, borderRadius: 14, marginBottom: 16 }}>
            <Text style={{ color: "#FF8A80", textAlign: "center" }}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => void handleFinish()}
          disabled={isSubmitting}
          style={{
            height: 52,
            borderRadius: 16,
            backgroundColor: colors.accent,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <MaterialIcons name="check" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Завершить тренировку</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
