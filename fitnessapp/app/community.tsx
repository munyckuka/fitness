import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { getStoredUserId } from "@/services/session-service";
import { getChatDialogs, searchUsersByLogin, type ChatDialog, type ChatUserSearchResult } from "@/services/chat-service";
import { colors } from "./theme";

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

  const getLoginInitial = (login?: string) => {
    const normalized = (login ?? "").trim().replace(/^@+/, "");
    if (!normalized) {
      return "?";
    }

    return normalized[0].toUpperCase();
  };

  const chatItems = dialogs.map((dialog: ChatDialog) => ({
    key: dialog.conversationId,
    name: dialog.peerName,
    login: dialog.peerLogin,
    message: dialog.lastMessageText || "Начните диалог",
    conversationId: dialog.conversationId,
    peerUserId: dialog.peerUserId,
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

          {searchResults.map((user: ChatUserSearchResult) => {
            const loginInitial = getLoginInitial(user.login);

            return (
              <TouchableOpacity
                key={user.id}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/chat",
                    params: {
                      name: user.name || user.login,
                      avatar: "",
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
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    marginRight: 10,
                    backgroundColor: colors.secondary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>{loginInitial}</Text>
                </View>
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
            Ваши чаты:
          </Text>



          {isLoadingDialogs ? <ActivityIndicator color={colors.accent} style={{ marginTop: 14 }} /> : null}

          {!isLoadingDialogs && chatItems.length === 0 ? (
            <Text style={{ color: colors.textSecondary, marginTop: 14 }}>Пока нет активных чатов.</Text>
          ) : null}

          {chatItems.map((chat: typeof chatItems[number]) => (
            <TouchableOpacity
              key={chat.key}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/chat",
                  params: {
                    name: chat.name,
                    avatar: "",
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
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  marginRight: 14,
                  backgroundColor: colors.secondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "700" }}>
                  {getLoginInitial(chat.login)}
                </Text>
              </View>
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
