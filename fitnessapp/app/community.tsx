import { useEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { getStoredUserId } from "@/services/session-service";
import { getChatDialogs, type ChatDialog } from "@/services/chat-service";
import { colors } from "./theme";

const AVATARS = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
];

const CHAT_PREVIEW = [
  { name: "Алексей", message: "сообщение", avatar: AVATARS[0] },
  { name: "Женя", message: "сообщение", avatar: AVATARS[1] },
  { name: "Артем", message: "сообщение", avatar: AVATARS[2] },
  { name: "Олег", message: "сообщение", avatar: AVATARS[4] },
];

export default function Community() {
  const router = useRouter();
  const [dialogs, setDialogs] = useState<ChatDialog[]>([]);
  const [isLoadingDialogs, setIsLoadingDialogs] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDialogs = async () => {
      try {
        const userId = await getStoredUserId();
        if (!userId) {
          return;
        }

        const items = await getChatDialogs(userId);
        if (isMounted) {
          setDialogs(Array.isArray(items) ? items : []);
        }
      } catch {
        if (isMounted) {
          setDialogs([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDialogs(false);
        }
      }
    };

    void loadDialogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const resolveAvatar = (seed: string) => {
    if (!seed) {
      return AVATARS[0];
    }

    const hash = seed
      .split("")
      .reduce((acc, symbol) => acc + symbol.charCodeAt(0), 0);

    return AVATARS[hash % AVATARS.length];
  };

  const chatItems = dialogs.length
    ? dialogs.map((dialog) => ({
        key: dialog.conversationId,
        name: dialog.peerName,
        message: dialog.lastMessageText || "Начните диалог",
        avatar: resolveAvatar(dialog.peerUserId),
        conversationId: dialog.conversationId,
        peerUserId: dialog.peerUserId,
      }))
    : CHAT_PREVIEW.map((chat) => ({
        key: chat.name,
        name: chat.name,
        message: chat.message,
        avatar: chat.avatar,
        conversationId: "",
        peerUserId: "",
      }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginTop: 26, marginBottom: 18 }}>
          Сообщество
        </Text>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 14 }}>
          <Image
            source={{ uri: "https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=37.620070,55.753630&z=13&l=map&size=650,430" }}
            style={{ width: "100%", height: 360, borderRadius: 14 }}
            resizeMode="cover"
          />
        </View>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginTop: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "500", marginBottom: 14 }}>
            Пользователи в вашем зале:
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            endFillColor="#FFFFFF"
            fadingEdgeLength={30}
          >
            <View style={{ flexDirection: "row", gap: 14 }}>
              {AVATARS.map((avatar, index) => (
                <Image
                  key={`gym-${index}`}
                  source={{ uri: avatar }}
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginTop: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "500", marginBottom: 14 }}>
            Ваши знакомые
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            endFillColor="#FFFFFF"
            fadingEdgeLength={30}
          >
            <View style={{ flexDirection: "row", gap: 14 }}>
              {AVATARS.map((avatar, index) => (
                <Image
                  key={`friends-${index}`}
                  source={{ uri: avatar }}
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                />
              ))}
            </View>
          </ScrollView>

          <View style={{ width: "100%", height: 2, backgroundColor: "#D8D8D8", marginTop: 8 }} />

          {isLoadingDialogs ? <ActivityIndicator color={colors.accent} style={{ marginTop: 14 }} /> : null}

          {chatItems.map((chat) => (
            <TouchableOpacity
              key={chat.key}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/chat",
                  params: {
                    name: chat.name,
                    avatar: chat.avatar,
                    conversationId: chat.conversationId,
                    peerUserId: chat.peerUserId,
                  },
                })
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 14,
                paddingVertical: 4,
              }}
            >
              <Image source={{ uri: chat.avatar }} style={{ width: 64, height: 64, borderRadius: 32, marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "500" }}>{chat.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>{chat.message}</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 22 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
