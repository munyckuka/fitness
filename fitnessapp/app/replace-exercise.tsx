import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors } from "./theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getStoredUserId } from "@/services/session-service";
import { replaceExercise, getUserWorkouts, searchExercises, ExerciseSearchResult } from "@/services/fitness-service";

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

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ExerciseSearchResult[]>([]);
  const [selected, setSelected] = useState<ExerciseSearchResult | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userId = await getStoredUserId();
        if (!userId) return;
        if (!workoutId || !exerciseId) return;

        // try to infer muscle group from existing workout and prefill suggestions
        const workouts = await getUserWorkouts(userId).catch(() => [] as any[]);
        const workout = workouts.find((w) => String(w.id) === String(workoutId));
        if (!workout) return;
        const ex = (workout.exercises ?? []).find((e: any) => String(e.id) === String(exerciseId));
        const muscle = ex ? (ex.muscle ?? "") : "";
        if (muscle) {
          const list = await searchExercises(undefined, muscle, 30).catch(() => []);
          setSuggestions(list);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleReplace = async () => {
    setMessage(null);
    if (!workoutId || !exerciseId) {
      setMessage("workoutId и exerciseId обязательны в параметрах маршрута.");
      return;
    }
    if (!newExerciseId) {
      setMessage("Выберите упражнение из списка или введите поиск по имени.");
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

  const handleSearch = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const list = await searchExercises(query, undefined, 50);
      setSuggestions(list);
      if (list.length === 0) setMessage("Ничего не найдено");
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

        <TextInput value={query} onChangeText={setQuery} placeholder="Поиск по названию (например: curl, press)" style={{ height: 44, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.thirdary, color: colors.textPrimary, marginBottom: 8 }} />
        <TouchableOpacity onPress={handleSearch} style={{ backgroundColor: colors.accent, paddingVertical: 10, borderRadius: 12, alignItems: "center", marginBottom: 12 }}>
          {isLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Найти</Text>}
        </TouchableOpacity>

        {suggestions.map((s) => (
          <TouchableOpacity key={s.id} onPress={() => { setSelected(s); setNewExerciseId(s.id); setMessage(null); }} style={{ padding: 12, borderRadius: 8, backgroundColor: selected?.id === s.id ? '#2E2E2E' : colors.thirdary, marginBottom: 8 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{s.name}</Text>
            <Text style={{ color: colors.textSecondary }}>{s.muscleGroupLabel ?? s.muscleGroup} · {s.requiredEquipmentLabel ?? s.requiredEquipment ?? '—'}</Text>
            {s.difficultyLabel ? <Text style={{ color: colors.textSecondary }}>{s.difficultyLabel}</Text> : null}
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={handleReplace} style={{ backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 12 }}>
          {isLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Заменить</Text>}
        </TouchableOpacity>

        {message ? <Text style={{ color: message.includes("успешно") ? "#8EE08E" : "#FF8A80" }}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

