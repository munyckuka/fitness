import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateWorkout, getUser, updateUser, type UserProfile } from "@/services/fitness-service";
import { mapEquipmentToBackend as mapEquipmentToBackendAuth, mapGoalToBackend as mapGoalToBackendAuth, mapLevelToBackend as mapLevelToBackendAuth, registerAppUser } from "@/services/auth-service";
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
const EQUIPMENT_OPTIONS = ["Домашний", "Гантели", "Спортивная площадка", "Тренажерный зал"];

function StepCard({ label, subtitle, selected, onPress }: { label: string; subtitle: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        backgroundColor: selected ? colors.accent : colors.thirdary,
        borderRadius: 20,
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
        minHeight: 140,
      }}
    >
      <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
        {label}
      </Text>
      <Text style={{ color: selected ? colors.textPrimary : colors.textSecondary, fontSize: 14, textAlign: "center" }}>
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

function Step3Equipment({ data, onUpdate }: { data: WorkoutData; onUpdate: (data: WorkoutData) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginBottom: 12 }}>
        К какому оборудованию у вас есть доступ?
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 32, lineHeight: 20 }}>
        Это необходимо для создания тренировки.
      </Text>

      <View style={{ gap: 12, marginBottom: 32 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Домашний"
              subtitle="Без снаряжения"
              selected={data.equipment === "Домашний"}
              onPress={() => onUpdate({ ...data, equipment: "Домашний" })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Гантели"
              subtitle="Только гантели"
              selected={data.equipment === "Гантели"}
              onPress={() => onUpdate({ ...data, equipment: "Гантели" })}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Спортивная площадка"
              subtitle="Турник, брусья"
              selected={data.equipment === "Спортивная площадка"}
              onPress={() => onUpdate({ ...data, equipment: "Спортивная площадка" })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StepCard
              label="Тренажерный зал"
              subtitle="Оборудование зала"
              selected={data.equipment === "Тренажерный зал"}
              onPress={() => onUpdate({ ...data, equipment: "Тренажерный зал" })}
            />
          </View>
        </View>
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
            placeholderTextColor="#999"
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 12,
              color: "#000000",
              fontSize: 16,
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
            placeholderTextColor="#999"
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 12,
              color: "#000000",
              fontSize: 16,
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
            placeholderTextColor="#999"
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 12,
              color: "#000000",
              fontSize: 16,
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
        {FREQUENCY_OPTIONS.map((frequency) => (
          <TouchableOpacity
            key={frequency}
            activeOpacity={0.8}
            onPress={() => onUpdate({ ...data, frequency })}
            style={{
              borderRadius: 18,
              backgroundColor: data.frequency === frequency ? colors.accent : colors.thirdary,
              paddingVertical: 18,
              paddingHorizontal: 18,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>{frequency} тренировки</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function CreateWorkout() {
  const router = useRouter();
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
      const authResponse = await registerAppUser({
        goal: mapGoalToBackendAuth(data.goal),
        experience: mapLevelToBackendAuth(data.experience),
        frequency: toNumber(data.frequency) ?? 3,
        equipment: [mapEquipmentToBackendAuth(data.equipment)],
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
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {steps.map((_, index) => (
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

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          disabled={isSubmitting}
          style={{
            marginTop: 32,
            height: 56,
            borderRadius: 16,
            backgroundColor: colors.accent,
            justifyContent: "center",
            alignItems: "center",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>
              {isRegisteredUser ? "Сгенерировать план" : isLastStep ? "Получить план" : "Продолжить"}
            </Text>
          )}
        </TouchableOpacity>

        {submitError ? (
          <Text style={{ color: "#FF8A80", fontSize: 14, marginTop: 12, textAlign: "center" }}>{submitError}</Text>
        ) : null}
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
    equipment: [mapEquipmentToBackend(data.equipment)],
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
    equipment: [mapEquipmentToBackend(data.equipment)],
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

function mapEquipmentToBackend(equipment?: string) {
  switch (equipment) {
    case "Домашний":
    case "bodyweight":
    case "":
      return "";
    case "Гантели":
    case "dumbbells":
    case "dumbbell":
      return "dumbbell";
    case "Спортивная площадка":
    case "outdoor":
    case "pullup_bar":
      return "pullup_bar";
    case "Тренажерный зал":
    case "gym":
    case "barbell":
      return "barbell";
    default:
      return "";
  }
}

function isValidEquipment(equipment?: string) {
  return Boolean(equipment && EQUIPMENT_OPTIONS.includes(equipment));
}
