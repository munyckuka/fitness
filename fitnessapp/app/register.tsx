import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, type ComponentProps } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getUser, getUserWorkouts, generateWorkout } from "@/services/fitness-service";
import { loginWithIdentifier } from "@/services/auth-service";
import { ApiError } from "@/services/api";
import { CURRENT_WORKOUT_ID_KEY, IS_REGISTERED_KEY, USER_ID_KEY } from "@/services/storage";
import { colors } from "./theme";

function AuthField({
  icon,
  secure,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  secure?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: ComponentProps<typeof TextInput>["autoCapitalize"];
}) {
  const [hidden, setHidden] = useState(Boolean(secure));

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        height: 54,
        borderRadius: 14,
        backgroundColor: colors.thirdary,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        paddingHorizontal: 14,
        marginBottom: 14,
      }}
    >
      <MaterialIcons name={icon} size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidden}
        autoCapitalize={autoCapitalize ?? "none"}
        autoCorrect={false}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={{ flex: 1, color: colors.textPrimary, fontSize: 16 }}
      />
      {secure ? (
        <TouchableOpacity activeOpacity={0.7} onPress={() => setHidden((current) => !current)} style={{ padding: 4 }}>
          <MaterialIcons name={hidden ? "visibility-off" : "visibility"} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function Register() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerLogin, setRegisterLogin] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRegistrationStart = async () => {
    const name = registerName.trim();
    const login = registerLogin.trim().toLowerCase();
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

    if (!login || login.length < 3) {
      setSubmitError("Введите логин не короче 3 символов.");
      return;
    }

    if (pwd.length < 8) {
      setSubmitError("Пароль должен быть не короче 8 символов.");
      return;
    }

    if (pwd !== registerPasswordConfirm.trim()) {
      setSubmitError("Пароли не совпадают.");
      return;
    }

    router.push({
      pathname: "/create-workout",
      params: {
        name,
        login,
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

    if (!normalizedPassword) {
      setSubmitError("Введите пароль.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const authPayload = await loginWithIdentifier(normalizedIdentifier, normalizedPassword);
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Title */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <MaterialIcons name="fitness-center" size={40} color="#FFFFFF" />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700" }}>
              {mode === "login" ? "С возвращением!" : "Создайте аккаунт"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 6, textAlign: "center" }}>
              {mode === "login" ? "Войдите, чтобы продолжить тренировки" : "Начните свой путь к лучшей форме"}
            </Text>
          </View>

          {/* Segmented toggle */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.thirdary,
              borderRadius: 14,
              padding: 4,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setMode("login");
                setSubmitError(null);
              }}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 10,
                backgroundColor: mode === "login" ? colors.accent : "transparent",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: mode === "login" ? "#FFFFFF" : colors.textSecondary, fontSize: 15, fontWeight: "700" }}>Вход</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setMode("register");
                setSubmitError(null);
              }}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 10,
                backgroundColor: mode === "register" ? colors.accent : "transparent",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: mode === "register" ? "#FFFFFF" : colors.textSecondary, fontSize: 15, fontWeight: "700" }}>Регистрация</Text>
            </TouchableOpacity>
          </View>

          {mode === "login" ? (
            <>
              <AuthField icon="alternate-email" value={identifier} onChangeText={setIdentifier} placeholder="Почта или логин" />
              <AuthField icon="lock" secure value={password} onChangeText={setPassword} placeholder="Пароль" />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: colors.accent,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 4,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="login" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700" }}>Войти</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <AuthField icon="person" autoCapitalize="words" value={registerName} onChangeText={setRegisterName} placeholder="Имя" />
              <AuthField icon="mail" keyboardType="email-address" value={registerEmail} onChangeText={setRegisterEmail} placeholder="Почта" />
              <AuthField icon="alternate-email" value={registerLogin} onChangeText={setRegisterLogin} placeholder="Логин" />
              <AuthField icon="lock" secure value={registerPassword} onChangeText={setRegisterPassword} placeholder="Пароль" />
              <AuthField icon="lock-outline" secure value={registerPasswordConfirm} onChangeText={setRegisterPasswordConfirm} placeholder="Подтвердите пароль" />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRegistrationStart}
                style={{
                  width: "100%",
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: colors.accent,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700", marginRight: 6 }}>Продолжить</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}

          {submitError ? (
            <View style={{ backgroundColor: "#FF8A8022", padding: 12, borderRadius: 14, marginTop: 16 }}>
              <Text style={{ color: "#FF8A80", fontSize: 14, textAlign: "center" }}>{submitError}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
