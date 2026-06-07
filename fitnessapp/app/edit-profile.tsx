import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getStoredUserId } from "@/services/session-service";
import { type UpdateUserInput } from "@/services/fitness-service";
import { mapEquipmentToBackend } from "@/services/auth-service";
import { getProfileOfflineFirst, updateProfileOfflineFirst } from "@/services/profile-cache";
import { colors } from "./theme";

const GOAL_OPTIONS = ["Сила", "Рост мышц", "Выносливость", "Похудение"];
const EXPERIENCE_OPTIONS = ["Новичок", "Средний", "Продвинутый"];
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
const FREQUENCY_OPTIONS = ["2", "3", "4"];

type FormState = {
  goal: string;
  experience: string;
  equipment: string;
  frequency: string;
  age: string;
  height: string;
  weight: string;
};

function OptionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: selected ? colors.accent : colors.thirdary,
        marginRight: 10,
        marginBottom: 10,
      }}
    >
      <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600", marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor="#999"
        style={{
          height: 48,
          borderRadius: 14,
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 14,
          color: "#000000",
          fontSize: 16,
        }}
      />
    </View>
  );
}

export default function EditProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    goal: "",
    experience: "",
    equipment: "",
    frequency: "",
    age: "",
    height: "",
    weight: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const storedUserId = await getStoredUserId();
        if (!storedUserId) throw new Error("Пользователь не найден.");

        setUserId(storedUserId);

        const applyUser = (user: NonNullable<Awaited<ReturnType<typeof getProfileOfflineFirst>>>) => {
          if (!isMounted) return;
          setForm({
            goal: user.goal,
            experience: user.experience,
            equipment: user.equipmentList[0] ?? user.equipment,
            frequency: user.frequency ? String(user.frequency) : "",
            age: user.age ? String(user.age) : "",
            height: user.height ? String(user.height) : "",
            weight: user.weight ? String(user.weight) : "",
          });
        };

        // Load from cache immediately; fresh data from API fills the form when ready.
        const cached = await getProfileOfflineFirst(storedUserId, (fresh) => applyUser(fresh));
        if (cached) applyUser(cached);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить данные профиля.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!userId) {
      setError("Пользователь не найден.");
      return;
    }

    if (!form.goal || !form.experience || !form.equipment || !form.frequency) {
      setError("Заполните цель, уровень, оборудование и частоту тренировок.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: UpdateUserInput = {
        goal: mapGoalToBackend(form.goal),
        experience: mapLevelToBackend(form.experience),
        frequency: Number(form.frequency) || 3,
        equipment: mapEquipmentToBackend(form.equipment),
        age: toNumber(form.age),
        height: toNumber(form.height),
        weight: toNumber(form.weight),
      };

      // Saves locally first, syncs in background — works offline.
      await updateProfileOfflineFirst(userId, payload);
      router.replace("/profile");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить изменения.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 24 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 10 }}
          >
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "700" }}>Редактировать профиль</Text>
        </View>

        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Цель</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 14 }}>
          {GOAL_OPTIONS.map((option) => (
            <OptionChip key={option} label={option} selected={form.goal === option} onPress={() => setField("goal", option)} />
          ))}
        </View>

        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Уровень</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 14 }}>
          {EXPERIENCE_OPTIONS.map((option) => (
            <OptionChip key={option} label={option} selected={form.experience === option} onPress={() => setField("experience", option)} />
          ))}
        </View>

        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Оборудование</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 14 }}>
          {EQUIPMENT_OPTIONS.map((option) => (
            <OptionChip key={option} label={option} selected={form.equipment === option} onPress={() => setField("equipment", option)} />
          ))}
        </View>

        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Частота тренировок</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 18 }}>
          {FREQUENCY_OPTIONS.map((option) => (
            <OptionChip
              key={option}
              label={`${option} тренировки`}
              selected={form.frequency === option}
              onPress={() => setField("frequency", option)}
            />
          ))}
        </View>

        <Field label="Возраст" value={form.age} onChangeText={(value) => setField("age", value)} placeholder="18" />
        <Field label="Рост" value={form.height} onChangeText={(value) => setField("height", value)} placeholder="175" />
        <Field label="Вес" value={form.weight} onChangeText={(value) => setField("weight", value)} placeholder="60" />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving}
          style={{
            marginTop: 18,
            height: 54,
            borderRadius: 16,
            backgroundColor: colors.accent,
            justifyContent: "center",
            alignItems: "center",
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700" }}>Сохранить изменения</Text>
          )}
        </TouchableOpacity>

        {error ? <Text style={{ color: "#FF8A80", fontSize: 14, marginTop: 12 }}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function toNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapGoalToBackend(goal: string) {
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

function mapLevelToBackend(level: string) {
  switch (level) {
    case "Новичок":
      return "beginner";
    case "Средний":
      return "intermediate";
    case "Продвинутый":
      return "advanced";
    default:
      return "beginner";
  }
}

