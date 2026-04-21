import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getUser, getUserWorkouts, generateWorkout } from "@/services/fitness-service";
import { buildLegacyEmail, LEGACY_DEFAULT_PASSWORD, loginWithEmail } from "@/services/auth-service";
import { ApiError } from "@/services/api";
import { CURRENT_WORKOUT_ID_KEY, IS_REGISTERED_KEY, USER_ID_KEY } from "@/services/storage";
import { colors } from "./theme";

export default function Register() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRegistrationStart = async () => {
    const name = registerName.trim();
    const email = registerEmail.trim().toLowerCase();
    const pwd = registerPassword.trim();

    if (!name) {
      setSubmitError("Введите имя.");
      return;
    }

    if (!email.includes("@")) {
      setSubmitError("Введите корректную почту.");
      return;
    }

    if (pwd.length < 8) {
      setSubmitError("Пароль должен быть не короче 8 символов.");
      return;
    }

    router.push({
      pathname: "/create-workout",
      params: {
        name,
        email,
        password: pwd,
      },
    });
  };

  const handleLogin = async () => {
    const normalizedIdentifier = identifier.trim();
    const normalizedPassword = password.trim();

    if (!normalizedIdentifier) {
      setSubmitError("Введите email или user id.");
      return;
    }

    const looksLikeEmail = normalizedIdentifier.includes("@");
    const looksLikeUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizedIdentifier);

    if (!looksLikeEmail && !looksLikeUUID) {
      setSubmitError("Введите корректный email или user id (UUID).");
      return;
    }

    if (looksLikeEmail && !normalizedPassword) {
      setSubmitError("Введите пароль.");
      return;
    }

    const loginEmail = looksLikeEmail ? normalizedIdentifier : buildLegacyEmail(normalizedIdentifier);
    const loginPassword = normalizedPassword || LEGACY_DEFAULT_PASSWORD;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const authPayload = await loginWithEmail(loginEmail, loginPassword);
      const user = await getUser(authPayload.user.id);
      const workouts = await getUserWorkouts(authPayload.user.id);
      let activeWorkoutId = workouts[0]?.id;

      if (!activeWorkoutId) {
        const generatedWorkout = await generateWorkout(authPayload.user.id, {
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
      <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "center", paddingHorizontal: 24, paddingTop: 60 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 48, fontWeight: "500", textAlign: "center", marginBottom: 18 }}>
          Вход/Регистрация
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
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Email или user id (UUID)"
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

            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Пароль (для legacy можно оставить пустым)"
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
          <>
            <TextInput
              value={registerName}
              onChangeText={setRegisterName}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Имя"
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

            <TextInput
              value={registerEmail}
              onChangeText={setRegisterEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Почта"
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

            <TextInput
              value={registerPassword}
              onChangeText={setRegisterPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Пароль"
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
              <Text style={{ color: "#000000", fontSize: 18, fontWeight: "500" }}>Продолжить</Text>
            </TouchableOpacity>
          </>
        )}

        {submitError ? (
          <Text style={{ color: "#FF8A80", fontSize: 14, marginTop: 12, textAlign: "center" }}>{submitError}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
