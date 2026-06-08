import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "./theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getStoredUserId } from "@/services/session-service";
import { replaceExercise, type ExerciseSearchResult } from "@/services/fitness-service";
import { getCachedWorkouts } from "@/services/workout-cache";
import { searchExercisesOfflineFirst } from "@/services/exercise-cache";

export default function ReplaceExercisePage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawWorkoutId = params.workoutId;
  const rawExerciseId = params.exerciseId;
  const workoutId = Array.isArray(rawWorkoutId) ? rawWorkoutId[0] : rawWorkoutId;
  const exerciseId = Array.isArray(rawExerciseId) ? rawExerciseId[0] : rawExerciseId;

  const [newExerciseId, setNewExerciseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ExerciseSearchResult[]>([]);
  const [selected, setSelected] = useState<ExerciseSearchResult | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userId = await getStoredUserId();
        if (!userId || !workoutId || !exerciseId) return;

        const workouts = await getCachedWorkouts(userId);
        const workout = workouts.find((w) => String(w.id) === String(workoutId));
        if (!workout) return;
        const ex = (workout.exercises ?? []).find((e: any) => String(e.id) === String(exerciseId));
        const muscle = ex ? (ex.muscle ?? "") : "";
        if (muscle) {
          const list = await searchExercisesOfflineFirst(undefined, muscle, 30);
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
      setMessage({ text: "Не переданы параметры тренировки.", success: false });
      return;
    }
    if (!newExerciseId) {
      setMessage({ text: "Выберите упражнение из списка.", success: false });
      return;
    }

    setIsLoading(true);
    try {
      const userId = await getStoredUserId();
      if (!userId) throw new Error("Сначала войдите или создайте профиль.");
      await replaceExercise(userId, workoutId, exerciseId, newExerciseId);
      setMessage({ text: "Упражнение заменено.", success: true });
      setTimeout(() => router.back(), 800);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : String(err), success: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setMessage(null);
    try {
      const list = await searchExercisesOfflineFirst(query, undefined, 50);
      setSuggestions(list);
      if (list.length === 0) setMessage({ text: "Ничего не найдено", success: false });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : String(err), success: false });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginBottom: 16, alignSelf: "flex-start" }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 6 }}>
          Заменить упражнение
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 4, marginBottom: 24 }}>
          Выберите подходящую замену
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
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <MaterialIcons name="search" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Поиск</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.secondary,
              borderRadius: 14,
              paddingHorizontal: 14,
              marginBottom: 12,
              height: 48,
            }}
          >
            <MaterialIcons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              placeholder="Например: жим, тяга, приседания..."
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
              style={{ flex: 1, color: colors.textPrimary, fontSize: 15 }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSearch}
            activeOpacity={0.8}
            style={{
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.secondary,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isSearching ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <MaterialIcons name="search" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600" }}>Найти</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {suggestions.length > 0 ? (
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
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <MaterialIcons name="format-list-bulleted" size={20} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>
                Упражнения · {suggestions.length}
              </Text>
            </View>

            {suggestions.map((s, idx) => {
              const isSelected = selected?.id === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.85}
                  onPress={() => { setSelected(s); setNewExerciseId(s.id); setMessage(null); }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: "rgba(255,255,255,0.05)",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.accent : `${colors.accent}22`,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <MaterialIcons name="fitness-center" size={18} color={isSelected ? "#FFFFFF" : colors.accent} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>{s.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }}>
                      {s.muscleGroupLabel ?? s.muscleGroup}
                      {s.requiredEquipmentLabel ?? s.requiredEquipment ? ` · ${s.requiredEquipmentLabel ?? s.requiredEquipment}` : ""}
                      {s.difficultyLabel ? ` · ${s.difficultyLabel}` : ""}
                    </Text>
                  </View>

                  {isSelected ? (
                    <MaterialIcons name="check-circle" size={22} color={colors.accent} />
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={22} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {message ? (
          <View
            style={{
              backgroundColor: message.success ? "#8EE08E22" : "#FF8A8022",
              padding: 12,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: message.success ? "#8EE08E" : "#FF8A80", textAlign: "center" }}>
              {message.text}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleReplace}
          activeOpacity={0.8}
          disabled={isLoading || !newExerciseId}
          style={{
            height: 52,
            borderRadius: 16,
            backgroundColor: newExerciseId ? colors.accent : colors.secondary,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="swap-horiz" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Заменить</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
