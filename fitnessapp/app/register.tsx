import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getUser, getUserWorkouts, generateWorkout } from "@/services/fitness-service";
import { loginLegacyByUserId } from "@/services/auth-service";
import { ApiError } from "@/services/api";
import { CURRENT_WORKOUT_ID_KEY, IS_REGISTERED_KEY, USER_ID_KEY } from "@/services/storage";
import { colors } from "./theme";

export default function Register() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userId, setUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRegistrationStart = async () => {
    router.push("/create-workout");
  };

  const handleLogin = async () => {
    const normalizedUserId = userId.trim();

    if (!normalizedUserId) {
      setSubmitError("Введите ваш ID пользователя.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await loginLegacyByUserId(normalizedUserId);
      const user = await getUser(normalizedUserId);
      const workouts = await getUserWorkouts(normalizedUserId);
      let activeWorkoutId = workouts[0]?.id;

      if (!activeWorkoutId) {
        const generatedWorkout = await generateWorkout(normalizedUserId, {
          goal: user.goal,
          experience: user.experience,
          equipment: user.equipment,
        });
        activeWorkoutId = generatedWorkout.id;
      }

      const sessionItems: [string, string][] = [
        [IS_REGISTERED_KEY, "true"],
        [USER_ID_KEY, user.id],
      ];

      if (activeWorkoutId) {
        sessionItems.push([CURRENT_WORKOUT_ID_KEY, activeWorkoutId]);
      }

      await AsyncStorage.multiSet(sessionItems);
      router.replace("/");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setSubmitError("Пользователь не найден. Пройдите регистрацию.");
      } else {
        setSubmitError(error instanceof Error ? error.message : "Не удалось выполнить вход.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 48, fontWeight: "500", textAlign: "center", marginBottom: 18 }}>
          Вход/Регистрация
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 16,
            textAlign: "center",
            lineHeight: 24,
            marginBottom: 40,
          }}
        >
          Продолжите, затем мы сохраним профиль и получим персональный план с сервера
        </Text>

        <View style={{ width: "100%", flexDirection: "row", gap: 10, marginBottom: 20 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setMode("login");
              setSubmitError(null);
            }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: mode === "login" ? colors.accent : colors.thirdary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>Вход</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setMode("register");
              setSubmitError(null);
            }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: mode === "register" ? colors.accent : colors.thirdary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>Регистрация</Text>
          </TouchableOpacity>
        </View>

        {mode === "login" ? (
          <>
            <TextInput
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Введите user id"
              placeholderTextColor="#999"
              style={{
                width: "100%",
                height: 52,
                borderRadius: 14,
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 14,
                color: "#000000",
                fontSize: 16,
                marginBottom: 14,
              }}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={isSubmitting}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 16,
                backgroundColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={{ color: "#000000", fontSize: 18, fontWeight: "500" }}>Войти</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRegistrationStart}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#000000", fontSize: 18, fontWeight: "500" }}>Создать профиль</Text>
        </TouchableOpacity>
        )}

        {submitError ? (
          <Text style={{ color: "#FF8A80", fontSize: 14, marginTop: 12, textAlign: "center" }}>{submitError}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
