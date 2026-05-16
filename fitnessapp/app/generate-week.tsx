import { useEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors } from "./theme";
import { getStoredUserId } from "@/services/session-service";
import { generateWeekWorkouts, type WorkoutSummary } from "@/services/fitness-service";
import { useRouter } from "expo-router";

export default function GenerateWeek() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // no-op
  }, []);

  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error("Сначала войдите или создайте профиль.");

      const generated = await generateWeekWorkouts(userId, startDate);
      setWorkouts(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Сгенерировать неделю тренировок</Text>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Дата начала (YYYY-MM-DD)</Text>
          <TextInput value={startDate} onChangeText={setStartDate} placeholder="2026-05-17" style={{ height: 44, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.thirdary, color: colors.textPrimary }} />
        </View>

        <TouchableOpacity onPress={handleGenerate} style={{ backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 12 }}>
          {isLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Сгенерировать</Text>}
        </TouchableOpacity>

        {error ? <Text style={{ color: "#FF8A80", marginBottom: 12 }}>{error}</Text> : null}

        {workouts ? (
          workouts.map((w) => (
            <View key={w.id} style={{ backgroundColor: colors.thirdary, borderRadius: 16, padding: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>{w.title}</Text>
                  <Text style={{ color: colors.textSecondary }}>{w.goal} · {w.exercises.length} упражнений</Text>
                </View>
                <View style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", backgroundColor: colors.secondary }}>
                  {w.exercises[0]?.imageUri ? <Image source={{ uri: w.exercises[0].imageUri }} style={{ width: "100%", height: "100%" }} /> : null}
                </View>
              </View>
              <View style={{ marginTop: 10 }}>
                {w.exercises.slice(0, 4).map((ex, idx) => (
                  <TouchableOpacity key={ex.id} onPress={() => router.push(`/workout-exercise?name=${encodeURIComponent(ex.name)}&category=${encodeURIComponent(ex.muscle)}&imageUri=${encodeURIComponent(ex.imageUri ?? "")}`)}>
                    <Text style={{ color: colors.textPrimary }}>{idx + 1}. {ex.name} {ex.weight ? `· ${ex.weight} кг` : ""}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

