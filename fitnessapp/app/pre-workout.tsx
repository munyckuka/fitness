import { useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "./theme";
import { setRecoveryMetrics } from "@/services/session-service";

const SLEEP_QUALITY_LABEL: Record<number, string> = {
  1: "Плохо",
  2: "Так себе",
  3: "Нормально",
  4: "Хорошо",
  5: "Отлично",
};

const STRESS_HINT: Record<number, string> = {
  1: "Полный покой",
  5: "Умеренный",
  10: "Очень высокий",
};

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
    await setRecoveryMetrics({ sleepHours: sleep, sleepQuality, stressLevel });
    router.replace(`/training-exercise?workoutId=${workoutId}&exercise=0`);
  };

  const stressHintEntry = Object.entries(STRESS_HINT)
    .reverse()
    .find(([k]) => stressLevel >= Number(k));

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
          Перед тренировкой
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 4, marginBottom: 24 }}>
          Расскажите о своём состоянии
        </Text>

        {/* Sleep hours */}
        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: `${colors.accent}22`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <MaterialIcons name="bedtime" size={20} color={colors.accent} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Часы сна</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.secondary,
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 48,
            }}
          >
            <MaterialIcons name="schedule" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              keyboardType="numeric"
              value={sleepHours}
              onChangeText={setSleepHours}
              placeholder="например, 7.5"
              placeholderTextColor={colors.textSecondary}
              style={{ flex: 1, color: colors.textPrimary, fontSize: 15 }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>ч</Text>
          </View>
        </View>

        {/* Sleep quality */}
        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: `${colors.accent}22`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <MaterialIcons name="star" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Качество сна</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {SLEEP_QUALITY_LABEL[sleepQuality]}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <TouchableOpacity
                key={v}
                activeOpacity={0.85}
                onPress={() => setSleepQuality(v)}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: sleepQuality === v ? colors.accent : colors.secondary,
                  borderWidth: sleepQuality === v ? 2 : 0,
                  borderColor: sleepQuality === v ? "rgba(255,255,255,0.35)" : "transparent",
                }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stress level */}
        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: `${colors.accent}22`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <MaterialIcons name="psychology" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Уровень стресса</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {stressHintEntry ? stressHintEntry[1] : ""}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const v = i + 1;
              const selected = stressLevel === v;
              return (
                <TouchableOpacity
                  key={v}
                  activeOpacity={0.85}
                  onPress={() => setStressLevel(v)}
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
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>{v}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => void handleStart()}
          style={{
            height: 52,
            borderRadius: 16,
            backgroundColor: colors.accent,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <MaterialIcons name="play-arrow" size={22} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Начать тренировку</Text>
        </TouchableOpacity>


      </ScrollView>
    </SafeAreaView>
  );
}
