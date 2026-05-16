import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors } from "./theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getStoredUserId } from "@/services/session-service";
import { replaceExercise } from "@/services/fitness-service";

export default function ReplaceExercisePage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawWorkoutId = params.workoutId;
  const rawExerciseId = params.exerciseId;
  const workoutId = Array.isArray(rawWorkoutId) ? rawWorkoutId[0] : rawWorkoutId;
  const exerciseId = Array.isArray(rawExerciseId) ? rawExerciseId[0] : rawExerciseId;

  const [newExerciseId, setNewExerciseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // nothing
  }, []);

  const handleReplace = async () => {
    setMessage(null);
    if (!workoutId || !exerciseId) {
      setMessage("workoutId и exerciseId обязательны в параметрах маршрута.");
      return;
    }
    if (!newExerciseId) {
      setMessage("Введите идентификатор нового упражнения.");
      return;
    }

    setIsLoading(true);
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error("Сначала войдите или создайте профиль.");

      await replaceExercise(userId, workoutId, exerciseId, newExerciseId);
      setMessage("Упражнение заменено успешно.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Заменить упражнение в тренировке</Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>workoutId: {workoutId}</Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>exerciseId: {exerciseId}</Text>

        <TextInput value={newExerciseId} onChangeText={setNewExerciseId} placeholder="Новый exerciseId" style={{ height: 44, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.thirdary, color: colors.textPrimary, marginBottom: 12 }} />

        <TouchableOpacity onPress={handleReplace} style={{ backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 12 }}>
          {isLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Заменить</Text>}
        </TouchableOpacity>

        {message ? <Text style={{ color: message.includes("успешно") ? "#8EE08E" : "#FF8A80" }}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

