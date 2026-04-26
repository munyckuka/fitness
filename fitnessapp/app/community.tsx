import { useEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { getStoredUserId } from "@/services/session-service";
import { getChatDialogs, searchUsersByLogin, type ChatDialog, type ChatUserSearchResult } from "@/services/chat-service";
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
  const [currentUserId, setCurrentUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDialogs = async () => {
      try {
        const userId = await getStoredUserId();
        if (!userId) {
          return;
        }

        setCurrentUserId(userId);

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

  const handleSearchUsers = async () => {
    const trimmedQuery = searchQuery.trim().replace(/^@+/, "");
    if (!trimmedQuery) {
      setSearchResults([]);
      setSearchError("Введите логин для поиска.");
      return;
    }

    if (!currentUserId) {
      setSearchError("Требуется авторизация.");
      return;
    }

    setIsSearchingUsers(true);
    setSearchError(null);

    try {
      const users = await searchUsersByLogin(currentUserId, trimmedQuery);
      setSearchResults(Array.isArray(users) ? users : []);
    } catch (error) {
      setSearchResults([]);
      setSearchError(error instanceof Error ? error.message : "Не удалось выполнить поиск.");
    } finally {
      setIsSearchingUsers(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginTop: 26, marginBottom: 18 }}>
          Сообщество
        </Text>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "500", marginBottom: 10 }}>
            Поиск по логину
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
            Найдите пользователя и сразу начните переписку
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TextInput
              placeholder="Введите логин"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
              }}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                void handleSearchUsers();
              }}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>Найти</Text>
            </TouchableOpacity>
          </View>

          {isSearchingUsers ? <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} /> : null}
          {searchError ? <Text style={{ color: "#FF8A80", marginTop: 10 }}>{searchError}</Text> : null}

          {searchResults.map((user) => {
            const avatar = resolveAvatar(user.id);

            return (
              <TouchableOpacity
                key={user.id}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/chat",
                    params: {
                      name: user.name || user.login,
                      avatar,
                      peerUserId: user.id,
                    },
                  })
                }
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 14,
                  padding: 10,
                }}
              >
                <Image source={{ uri: avatar }} style={{ width: 46, height: 46, borderRadius: 23, marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "600" }}>{user.name || "Пользователь"}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>@{user.login}</Text>
                </View>
                <View style={{ backgroundColor: colors.secondary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "600" }}>Написать</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {!isSearchingUsers && searchQuery.trim().length > 0 && searchResults.length === 0 && !searchError ? (
            <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Пользователи не найдены.</Text>
          ) : null}
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
