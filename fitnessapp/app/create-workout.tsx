import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateWorkout, getUser, updateUser, type UserProfile } from "@/services/fitness-service";
import { mapEquipmentToBackend, mapGoalToBackend as mapGoalToBackendAuth, mapLevelToBackend as mapLevelToBackendAuth, registerWithProfile } from "@/services/auth-service";
import { CURRENT_WORKOUT_ID_KEY, IS_REGISTERED_KEY, USER_ID_KEY } from "@/services/storage";
import { colors } from "./theme";

type WorkoutData = {
  goal?: string;
  experience?: string;
  equipment?: string;
  frequency?: string;
  age?: string;
  height?: string;
  weight?: string;
};

type WorkoutStepComponent = (props: { data: WorkoutData; onUpdate: (data: WorkoutData) => void }) => React.JSX.Element;

const FREQUENCY_OPTIONS = ["2", "3", "4"];
const EQUIPMENT_OPTIONS = [
  "Домашний",
  "Гантели",
  "Спортивная площадка",
  "Тренажерный зал",
  "Кеттлбелл",
  "Кроссовер/Кабель",
  "Резинка",
  "Мяч",
  "Нет",
];

function StepCard({ label, subtitle, selected, onPress }: { label: string; subtitle: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        backgroundColor: selected ? colors.accent : colors.thirdary,
        borderRadius: 20,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
        minHeight: 130,
        borderWidth: 1,
        borderColor: selected ? colors.accent : "rgba(255,255,255,0.06)",
      }}
    >
      {selected ? (
        <MaterialIcons name="check-circle" size={20} color="#FFFFFF" style={{ position: "absolute", top: 12, right: 12 }} />
      ) : null}
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
        {label}
      </Text>
      <Text style={{ color: selected ? "rgba(255,255,255,0.85)" : colors.textSecondary, fontSize: 14, textAlign: "center" }}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function Step1Goal({ data, onUpdate }: { data: WorkoutData; onUpdate: (data: WorkoutData) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginBottom: 12 }}>
        Какова ваша фитнес-цель?
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 32, lineHeight: 20 }}>
        Это необходимо для создания тренировки.
      </Text>

      <View style={{ gap: 12, marginBottom: 32 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Сила"
              subtitle="поднимать тяжёлые веса"
              selected={data.goal === "Сила"}
              onPress={() => onUpdate({ ...data, goal: "Сила" })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Рост мышц"
              subtitle="улучшить эстетику"
              selected={data.goal === "Рост мышц"}
              onPress={() => onUpdate({ ...data, goal: "Рост мышц" })}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Выносливость"
              subtitle="повысить выносливость"
              selected={data.goal === "Выносливость"}
              onPress={() => onUpdate({ ...data, goal: "Выносливость" })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Похудение"
              subtitle="сжигать жир"
              selected={data.goal === "Похудение"}
              onPress={() => onUpdate({ ...data, goal: "Похудение" })}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function Step2Experience({ data, onUpdate }: { data: WorkoutData; onUpdate: (data: WorkoutData) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginBottom: 12 }}>
        Как долго вы тренируетесь?
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 32, lineHeight: 20 }}>
        Это необходимо для создания тренировки.
      </Text>

      <View style={{ gap: 12, marginBottom: 32 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Новичок"
              subtitle="0-3 месяца"
              selected={data.experience === "Новичок"}
              onPress={() => onUpdate({ ...data, experience: "Новичок" })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Базовый"
              subtitle="3-6 месяца"
              selected={data.experience === "Базовый"}
              onPress={() => onUpdate({ ...data, experience: "Базовый" })}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Средний"
              subtitle="6-12месяцев"
              selected={data.experience === "Средний"}
              onPress={() => onUpdate({ ...data, experience: "Средний" })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Продвинутый"
              subtitle="Больше года"
              selected={data.experience === "Продвинутый"}
              onPress={() => onUpdate({ ...data, experience: "Продвинутый" })}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const EQUIPMENT_SUBTITLES: Record<string, string> = {
  "Домашний": "Собственный вес",
  "Гантели": "Гантели + б/вес",
  "Спортивная площадка": "Турник, брусья",
  "Тренажерный зал": "Штанга, тренажёры",
  "Кеттлбелл": "Гиря + б/вес",
  "Кроссовер/Кабель": "Кабельный блок",
  "Резинка": "Резиновая лента",
  "Мяч": "Медицинский мяч",
  "Нет": "Совсем без снаряжения",
};

function Step3Equipment({ data, onUpdate }: { data: WorkoutData; onUpdate: (data: WorkoutData) => void }) {
  const pairs = [];
  for (let i = 0; i < EQUIPMENT_OPTIONS.length; i += 2) {
    pairs.push(EQUIPMENT_OPTIONS.slice(i, i + 2));
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginBottom: 12 }}>
        К какому оборудованию у вас есть доступ?
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 32, lineHeight: 20 }}>
        Это необходимо для создания тренировки.
      </Text>

      <View style={{ gap: 12, marginBottom: 32 }}>
        {pairs.map((pair, rowIdx) => (
          <View key={rowIdx} style={{ flexDirection: "row", gap: 12 }}>
            {pair.map((option) => (
              <View key={option} style={{ flex: 1 }}>
                <StepCard
                  label={option}
                  subtitle={EQUIPMENT_SUBTITLES[option] ?? ""}
                  selected={data.equipment === option}
                  onPress={() => onUpdate({ ...data, equipment: option })}
                />
              </View>
            ))}
            {pair.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        ))}
      </View>
    </View>
  );
}

function Step4Parameters({ data, onUpdate }: { data: WorkoutData; onUpdate: (data: WorkoutData) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginBottom: 12 }}>
        Введите ваши параметры
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 28, lineHeight: 20 }}>
        Это необходимо для создания тренировки. Можно изменить в профиле.
      </Text>

      <View style={{ gap: 16, marginBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "500", width: 80 }}>Возраст:</Text>
          <TextInput
            value={data.age ?? ""}
            onChangeText={(v) => onUpdate({ ...data, age: v })}
            keyboardType="numeric"
            placeholder="18 лет"
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.thirdary,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              paddingHorizontal: 14,
              color: colors.textPrimary,
              fontSize: 16,
              fontWeight: "600",
            }}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "500", width: 80 }}>Рост:</Text>
          <TextInput
            value={data.height ?? ""}
            onChangeText={(v) => onUpdate({ ...data, height: v })}
            keyboardType="numeric"
            placeholder="175 см."
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.thirdary,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              paddingHorizontal: 14,
              color: colors.textPrimary,
              fontSize: 16,
              fontWeight: "600",
            }}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "500", width: 80 }}>Вес:</Text>
          <TextInput
            value={data.weight ?? ""}
            onChangeText={(v) => onUpdate({ ...data, weight: v })}
            keyboardType="numeric"
            placeholder="60 кг."
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.thirdary,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              paddingHorizontal: 14,
              color: colors.textPrimary,
              fontSize: 16,
              fontWeight: "600",
            }}
          />
        </View>
      </View>
    </View>
  );
}

function Step5Frequency({ data, onUpdate }: { data: WorkoutData; onUpdate: (data: WorkoutData) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginBottom: 12 }}>
        Сколько раз в неделю будете тренироваться?
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 32, lineHeight: 20 }}>
        От этого зависит объём и структура плана.
      </Text>

      <View style={{ gap: 12, marginBottom: 32 }}>
        {FREQUENCY_OPTIONS.map((frequency: string) => {
          const isSelected = data.frequency === frequency;

          return (
            <TouchableOpacity
              key={frequency}
              activeOpacity={0.8}
              onPress={() => onUpdate({ ...data, frequency })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 18,
                backgroundColor: isSelected ? colors.accent : colors.thirdary,
                borderWidth: 1,
                borderColor: isSelected ? colors.accent : "rgba(255,255,255,0.06)",
                paddingVertical: 18,
                paddingHorizontal: 18,
              }}
            >
              <MaterialIcons
                name={isSelected ? "radio-button-checked" : "radio-button-unchecked"}
                size={22}
                color={isSelected ? "#FFFFFF" : colors.textSecondary}
                style={{ marginRight: 14 }}
              />
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>{frequency} тренировки в неделю</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function CreateWorkout() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; login?: string; email?: string; password?: string }>();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WorkoutData>({});
  const [isPreparingFlow, setIsPreparingFlow] = useState(true);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [registeredUserProfile, setRegisteredUserProfile] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const prepareFlow = async () => {
      try {
        const [registrationFlag, storedUserId] = await AsyncStorage.multiGet([IS_REGISTERED_KEY, USER_ID_KEY]);
        const isRegistered = registrationFlag[1] === "true" && Boolean(storedUserId[1]);

        if (!isMounted) {
          return;
        }

        setIsRegisteredUser(isRegistered);
        setRegisteredUserId(storedUserId[1]);

        if (isRegistered && storedUserId[1]) {
          const user = await getUser(storedUserId[1]);

          if (!isMounted) {
            return;
          }

          setRegisteredUserProfile(user);
          setData({
            goal: user.goal,
            experience: user.experience,
            equipment: user.equipmentList[0] ?? user.equipment,
            frequency: user.frequency ? String(user.frequency) : undefined,
            age: user.age ? String(user.age) : undefined,
            height: user.height ? String(user.height) : undefined,
            weight: user.weight ? String(user.weight) : undefined,
          });
        }
      } catch (error) {
        if (isMounted) {
          setSubmitError(error instanceof Error ? error.message : "Не удалось подготовить создание тренировки.");
        }
      } finally {
        if (isMounted) {
          setIsPreparingFlow(false);
        }
      }
    };

    void prepareFlow();

    return () => {
      isMounted = false;
    };
  }, []);

  const steps = isRegisteredUser
    ? [
        { title: "Цель", screen: Step1Goal },
        { title: "Оборудование", screen: Step3Equipment },
        { title: "Частота", screen: Step5Frequency },
      ]
    : [
        { title: "Цель", screen: Step1Goal },
        { title: "Опыт", screen: Step2Experience },
        { title: "Оборудование", screen: Step3Equipment },
        { title: "Параметры", screen: Step4Parameters },
        { title: "Частота", screen: Step5Frequency },
      ];

  const CurrentScreen = steps[step].screen as WorkoutStepComponent;

  const isLastStep = step === steps.length - 1;

  const registrationName = typeof params.name === "string" ? params.name.trim() : "";
  const registrationLogin = typeof params.login === "string" ? params.login.trim().toLowerCase() : "";
  const registrationEmail = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  const registrationPassword = typeof params.password === "string" ? params.password : "";

  const handleContinue = async () => {
    setSubmitError(null);

    if (isRegisteredUser) {
      if (!registeredUserId) {
        setSubmitError("Не найден зарегистрированный пользователь. Войдите заново.");
        return;
      }

      if (!isCurrentStepValid(step, data, true)) {
        setSubmitError("Заполните текущий шаг перед продолжением.");
        return;
      }

      if (!isLastStep) {
        setStep(step + 1);
        return;
      }

      if (!registeredUserProfile) {
        setSubmitError("Не удалось загрузить текущий профиль пользователя.");
        return;
      }

      setIsSubmitting(true);

      try {
        const updatedUser = await updateUser(registeredUserId, buildRegisteredProfilePayload(data, registeredUserProfile));
        const workout = await generateWorkout(
          registeredUserId,
          {
            goal: updatedUser.goal,
            experience: updatedUser.experience,
            equipment: updatedUser.equipment,
          },
        );

        setRegisteredUserProfile(updatedUser);

        await AsyncStorage.multiSet([
          [IS_REGISTERED_KEY, "true"],
          [USER_ID_KEY, registeredUserId],
          [CURRENT_WORKOUT_ID_KEY, workout.id],
        ]);

        router.replace("/");
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Не удалось получить план тренировки.");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!isCurrentStepValid(step, data)) {
      setSubmitError("Заполните текущий шаг перед продолжением.");
      return;
    }

    if (!isLastStep) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!registrationName || !registrationLogin || !registrationEmail || !registrationPassword) {
        throw new Error("Сначала введите имя, логин, почту и пароль на экране регистрации.");
      }

      const authResponse = await registerWithProfile({
        name: registrationName,
        login: registrationLogin,
        email: registrationEmail,
        password: registrationPassword,
        goal: mapGoalToBackendAuth(data.goal),
        experience: mapLevelToBackendAuth(data.experience),
        frequency: toNumber(data.frequency) ?? 3,
        equipment: mapEquipmentToBackend(data.equipment),
        age: toNumber(data.age),
        height: toNumber(data.height),
        weight: toNumber(data.weight),
      });

      const user = {
        id: authResponse.user.id,
        goal: data.goal ?? "Персональный план",
        experience: data.experience ?? "Новичок",
        equipment: data.equipment ?? "Домашний",
      };

      if (!user.id) {
        throw new Error("Сервер не вернул идентификатор пользователя.");
      }

      const workout = await generateWorkout(user.id, {
        goal: user.goal,
        experience: user.experience,
        equipment: user.equipment,
      });

      await AsyncStorage.multiSet([
        [IS_REGISTERED_KEY, "true"],
        [USER_ID_KEY, user.id],
        [CURRENT_WORKOUT_ID_KEY, workout.id],
      ]);

      router.replace("/");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось получить план тренировки.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPreparingFlow) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 20 }}>
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.thirdary, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcons name="arrow-back-ios-new" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>
              Шаг {step + 1} из {steps.length}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {steps.map((_: unknown, index: number) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index <= step ? colors.accent : colors.thirdary,
                }}
              />
            ))}
          </View>
        </View>

        <CurrentScreen data={data} onUpdate={setData} />

        {submitError ? (
          <View style={{ backgroundColor: "#FF8A8022", padding: 12, borderRadius: 14, marginTop: 8 }}>
            <Text style={{ color: "#FF8A80", fontSize: 14, textAlign: "center" }}>{submitError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          disabled={isSubmitting}
          style={{
            marginTop: 24,
            height: 56,
            borderRadius: 16,
            backgroundColor: colors.accent,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginRight: 6 }}>
                {isRegisteredUser ? "Сгенерировать план" : isLastStep ? "Получить план" : "Продолжить"}
              </Text>
              <MaterialIcons name={isLastStep ? "auto-awesome" : "arrow-forward"} size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function isCurrentStepValid(step: number, data: WorkoutData, isRegisteredUser = false) {
  if (isRegisteredUser) {
    switch (step) {
      case 0:
        return Boolean(data.goal);
      case 1:
        return isValidEquipment(data.equipment);
      case 2:
        return Boolean(data.frequency);
      default:
        return true;
    }
  }

  switch (step) {
    case 0:
      return Boolean(data.goal);
    case 1:
      return Boolean(data.experience);
    case 2:
      return isValidEquipment(data.equipment);
    case 3:
      return Boolean(data.age && data.height && data.weight);
    case 4:
      return Boolean(data.frequency);
    default:
      return true;
  }
}

function buildProfilePayload(data: WorkoutData) {
  return {
    goal: mapGoalToBackend(data.goal),
    experience: mapLevelToBackend(data.experience),
    frequency: toNumber(data.frequency) ?? 3,
    equipment: mapEquipmentToBackend(data.equipment),
    age: toNumber(data.age),
    height: toNumber(data.height),
    weight: toNumber(data.weight),
  };
}

function buildRegisteredProfilePayload(data: WorkoutData, user: UserProfile) {
  return {
    goal: mapGoalToBackend(data.goal),
    experience: mapLevelToBackend(user.experience),
    frequency: toNumber(data.frequency) ?? user.frequency ?? 3,
    equipment: mapEquipmentToBackend(data.equipment),
    age: user.age,
    height: user.height,
    weight: user.weight,
  };
}

function toNumber(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapGoalToBackend(goal?: string) {
  switch (goal) {
    case "Сила":
      return "strength";
    case "Рост мышц":
      return "mass";
    case "Выносливость":
      return "endurance";
    case "Похудение":
      return "weight_loss";
    default:
      return "mass";
  }
}

function mapLevelToBackend(level?: string) {
  switch (level) {
    case "Новичок":
      return "beginner";
    case "Базовый":
    case "Средний":
      return "intermediate";
    case "Продвинутый":
      return "advanced";
    default:
      return "beginner";
  }
}

function isValidEquipment(equipment?: string) {
  return Boolean(equipment && EQUIPMENT_OPTIONS.includes(equipment));
}
