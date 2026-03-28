import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { HAS_LAUNCHED_KEY } from "@/services/storage";
import { colors } from "./theme";

export default function Welcome() {
  const router = useRouter();

  const handleStart = async () => {
    await AsyncStorage.setItem(HAS_LAUNCHED_KEY, "true");
    router.replace("/register");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 48, fontWeight: "500", textAlign: "center" }}>
          Добро пожаловать
        </Text>

        <Text
          style={{
            color: "#7A7D81",
            fontSize: 20,
            marginTop: 12,
            textAlign: "center",
            lineHeight: 28,
          }}
        >
          Создайте тренировку подходящую вам.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleStart}
          style={{
            marginTop: 26,
            height: 56,
            borderRadius: 16,
            backgroundColor: colors.accent,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "500" }}>Начать</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
