import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { colors } from "./theme";

export default function WorkoutExerciseDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; category?: string; imageUri?: string; description?: string }>();
  const exerciseName = typeof params.name === "string" ? params.name : "Упражнение";
  const category = typeof params.category === "string" ? params.category : "Группа мышц";
  const imageUri = typeof params.imageUri === "string" && params.imageUri.length > 0 ? params.imageUri : null;
  const description = typeof params.description === "string" && params.description.length > 0 ? params.description : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 30 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, marginBottom: 16, flexDirection: "row", alignItems: "center", marginTop: 30 }}>
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
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: "100%", height: 260 }} resizeMode="cover" />
          ) : (
            <View style={{ width: "100%", height: 260, backgroundColor: `${colors.accent}22`, justifyContent: "center", alignItems: "center" }}>
              <MaterialIcons name="fitness-center" size={64} color={colors.accent} />
            </View>
          )}
        </View>

        {description ? (
          <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
            <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 10 }}>Описание</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>{description}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
