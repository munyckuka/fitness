import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors } from "./theme";

const MOCK_MESSAGES = {
  "Алексей": [
    { id: "1", author: "them", text: "Ты сегодня идешь в зал после работы?", time: "18:12" },
    { id: "2", author: "me", text: "Да, хочу сделать спину и плечи. Ты со мной?", time: "18:14" },
    { id: "3", author: "them", text: "Да, давай. Встретимся у стойки с гантелями через 20 минут.", time: "18:15" },
  ],
  "Женя": [
    { id: "1", author: "them", text: "Как тебе новая программа на эту неделю?", time: "09:21" },
    { id: "2", author: "me", text: "Неплохо, но приседания после тяги тяжело заходят.", time: "09:24" },
    { id: "3", author: "them", text: "Согласен. Я бы поменял местами и оставил больше отдыха.", time: "09:25" },
  ],
  "Артем": [
    { id: "1", author: "them", text: "Скинь потом веса по жиму, интересно сравнить прогресс.", time: "14:08" },
    { id: "2", author: "me", text: "Ок, сегодня после тренировки отправлю скрин из приложения.", time: "14:10" },
    { id: "3", author: "them", text: "Отлично, я тоже обновлю свои результаты.", time: "14:11" },
  ],
  "Олег": [
    { id: "1", author: "them", text: "Завтра кардио или силовая?", time: "20:03" },
    { id: "2", author: "me", text: "Сначала легкое кардио, потом короткая силовая на ноги.", time: "20:06" },
    { id: "3", author: "them", text: "Тогда я присоединюсь к разминке в 7:30.", time: "20:07" },
  ],
} as const;

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatar?: string }>();
  const contactName = typeof params.name === "string" ? params.name : "Чат";
  const avatar = typeof params.avatar === "string" ? params.avatar : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop";
  const messages = MOCK_MESSAGES[contactName as keyof typeof MOCK_MESSAGES] ?? MOCK_MESSAGES["Алексей"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 18,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 10 }}
          >
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <Image source={{ uri: avatar }} style={{ width: 46, height: 46, borderRadius: 23, marginRight: 12 }} />

          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>{contactName}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>был(а) в сети 2 мин назад</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.thirdary, alignItems: "center", justifyContent: "center" }}
        >
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignSelf: "center", backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 18 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Сегодня</Text>
        </View>

        {messages.map((message) => {
          const isMine = message.author === "me";

          return (
            <View
              key={message.id}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                maxWidth: "80%",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: isMine ? colors.accent : colors.thirdary,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomRightRadius: isMine ? 6 : 20,
                  borderBottomLeftRadius: isMine ? 20 : 6,
                }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 21 }}>{message.text}</Text>
              </View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  marginTop: 5,
                  alignSelf: isMine ? "flex-end" : "flex-start",
                }}
              >
                {message.time}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 24,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.06)",
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.thirdary,
            borderRadius: 24,
            paddingLeft: 16,
            paddingRight: 8,
            paddingVertical: 8,
          }}
        >
          <TextInput
            editable={false}
            placeholder="Сообщение"
            placeholderTextColor={colors.textSecondary}
            style={{ flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 8 }}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="send" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}