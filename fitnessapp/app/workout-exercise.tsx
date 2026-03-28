import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { colors } from "./theme";

const CATEGORY_GUIDES: Record<string, { focus: string; tips: string[] }> = {
  "Бицепс": {
    focus: "Контролируйте движение и не раскачивайте корпус.",
    tips: ["Работайте в полной амплитуде", "Держите локти ближе к корпусу", "Не бросайте вес вниз"],
  },
  "Трицепс": {
    focus: "Следите, чтобы локти не расходились в стороны.",
    tips: ["Стабилизируйте плечи", "Не выгибайте поясницу", "Добавляйте вес постепенно"],
  },
  "Грудь": {
    focus: "Сводите лопатки и удерживайте грудь раскрытой.",
    tips: ["Опускайте вес подконтрольно", "Не поднимайте таз", "Соблюдайте паузу внизу"],
  },
  "Плечи": {
    focus: "Избегайте инерции и рывков в верхней точке.",
    tips: ["Не зажимайте шею", "Контролируйте траекторию", "Работайте в комфортной амплитуде"],
  },
  "Спина": {
    focus: "Тяните локтями и держите нейтральную спину.",
    tips: ["Не округляйте поясницу", "Сводите лопатки", "Не форсируйте вес"],
  },
  "Ягодицы": {
    focus: "Сконцентрируйтесь на пиковом сокращении в верхней точке.",
    tips: ["Упирайтесь пятками", "Не переразгибайте поясницу", "Добавляйте паузу сверху"],
  },
  "Квадрицепс": {
    focus: "Сохраняйте устойчивую стойку и полный контроль коленей.",
    tips: ["Колени направляйте по носкам", "Держите корпус собранным", "Не сокращайте глубину без причины"],
  },
  "Бицепс бедра": {
    focus: "Работайте от таза и не теряйте натяжение в задней поверхности бедра.",
    tips: ["Сохраняйте мягкие колени", "Держите спину ровной", "Не ускоряйтесь в нижней точке"],
  },
  "Пресс": {
    focus: "Дышите ритмично и не перегружайте шею.",
    tips: ["Напрягайте корпус заранее", "Делайте движение медленно", "Не тяните голову руками"],
  },
};

export default function WorkoutExerciseDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; category?: string; imageUri?: string }>();
  const exerciseName = typeof params.name === "string" ? params.name : "Упражнение";
  const category = typeof params.category === "string" ? params.category : "Группа мышц";
  const imageUri =
    typeof params.imageUri === "string"
      ? params.imageUri
      : "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=600";
  const guide = CATEGORY_GUIDES[category] ?? {
    focus: "Соблюдайте технику и не спешите увеличивать вес.",
    tips: ["Следите за дыханием", "Разминайтесь перед подходами", "Работайте без рывков"],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, marginBottom: 16, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.thirdary, alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{category}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "700", marginTop: 2 }}>{exerciseName}</Text>
          </View>
        </View>

        <View style={{ marginHorizontal: 20, borderRadius: 24, overflow: "hidden", backgroundColor: colors.thirdary }}>
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: 260 }} resizeMode="cover" />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 10 }}>На что обратить внимание</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>{guide.focus}</Text>
          </View>

          <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>Короткие подсказки</Text>
            {guide.tips.map((tip) => (
              <View key={tip} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 7, marginRight: 10 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, flex: 1 }}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 10 }}>Пример схемы</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
              3-4 подхода по 8-15 повторений. Начните с умеренного веса, выполните 1-2 разминочных подхода и только потом переходите к рабочим.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}