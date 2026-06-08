import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
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
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 26 }}>
          Сообщество
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 4, marginBottom: 20 }}>
          Найдите единомышленников и начните общение
        </Text>

        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <MaterialIcons name="person-search" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Поиск по логину</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.secondary,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
                paddingHorizontal: 12,
              }}
            >
              <MaterialIcons name="alternate-email" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="Введите логин"
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => {
                  void handleSearchUsers();
                }}
                returnKeyType="search"
                style={{
                  flex: 1,
                  color: colors.textPrimary,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  fontSize: 15,
                }}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                void handleSearchUsers();
              }}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 14,
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {isSearchingUsers ? <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} /> : null}
          {searchError ? (
            <View style={{ backgroundColor: "#FF8A8022", padding: 10, borderRadius: 12, marginTop: 12 }}>
              <Text style={{ color: "#FF8A80", textAlign: "center" }}>{searchError}</Text>
            </View>
          ) : null}

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
                  backgroundColor: colors.secondary,
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
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
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
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.accent,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <MaterialIcons name="chat-bubble-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>Написать</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {!isSearchingUsers && searchQuery.trim().length > 0 && searchResults.length === 0 && !searchError ? (
            <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: "center" }}>Пользователи не найдены.</Text>
          ) : null}
        </View>

        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginTop: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <MaterialIcons name="forum" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Ваши чаты</Text>
          </View>

          {isLoadingDialogs ? <ActivityIndicator color={colors.accent} style={{ marginTop: 18 }} /> : null}

          {!isLoadingDialogs && chatItems.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <MaterialIcons name="chat-bubble-outline" size={40} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Пока нет активных чатов.</Text>
            </View>
          ) : null}

          {chatItems.map((chat: typeof chatItems[number], index: number) => (
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
                paddingVertical: 14,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: "rgba(255,255,255,0.05)",
              }}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  marginRight: 14,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "700" }}>
                  {getLoginInitial(chat.login)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "600" }}>{chat.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }} numberOfLines={1}>
                  {chat.message}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
