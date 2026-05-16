import { useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "./theme";
import { setRecoveryMetrics } from "@/services/session-service";

export default function PreWorkout() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawWorkoutId = params.workoutId;
  const workoutId = Array.isArray(rawWorkoutId) ? rawWorkoutId[0] ?? "" : rawWorkoutId ?? "";

  const [sleepHours, setSleepHours] = useState<string>("");
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [stressLevel, setStressLevel] = useState<number>(3);

  const handleStart = async () => {
    const sleep = Number(sleepHours) || undefined;

    await setRecoveryMetrics({
      sleepHours: sleep,
      sleepQuality,
      stressLevel,
    });

    // navigate to first exercise
    router.replace(`/training-exercise?workoutId=${workoutId}&exercise=0`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 24, lineHeight: 32, fontWeight: "600", marginBottom: 18 }}>
          Перед началом тренировки
        </Text>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>Сколько часов вы спали?</Text>
          <TextInput
            keyboardType="numeric"
            value={sleepHours}
            onChangeText={setSleepHours}
            placeholder="например, 7.5"
            style={{
              backgroundColor: colors.background,
              padding: 10,
              borderRadius: 10,
              color: colors.textPrimary,
              marginBottom: 12,
            }}
          />

          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>Качество сна (1-5)</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => setSleepQuality(v)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: sleepQuality === v ? colors.accent : colors.secondary,
                }}
              >
                <Text style={{ color: colors.textPrimary }}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>Уровень стресса (1-10)</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const v = i + 1;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => setStressLevel(v)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: stressLevel === v ? colors.accent : colors.secondary,
                  }}
                >
                  <Text style={{ color: colors.textPrimary }}>{v}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => void handleStart()}
          style={{
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.accent,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Начать тренировку</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace(`/training-exercise?workoutId=${workoutId}&exercise=0`)}
          style={{
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.secondary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Пропустить</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

