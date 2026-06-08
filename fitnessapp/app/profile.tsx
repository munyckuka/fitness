import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { type UserProfile, type WorkoutSummary } from "@/services/fitness-service";
import { getChatDialogs, type ChatDialog } from "@/services/chat-service";
import { getStoredUserId, setStoredWorkoutId, clearStoredUserId } from "@/services/session-service";
import { getProfileOfflineFirst } from "@/services/profile-cache";
import { getWorkoutsOfflineFirst } from "@/services/workout-cache";
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

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [dialogs, setDialogs] = useState<ChatDialog[]>([]);
  const [isLoadingDialogs, setIsLoadingDialogs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutModalOpen(false);
    await clearStoredUserId();
    router.replace("/register");
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const userId = await getStoredUserId();

      if (!userId) {
        if (isMounted) {
          setError("Профиль еще не создан.");
          setIsLoading(false);
        }
        return;
      }

      try {
        // Both load from cache immediately; API updates arrive via callbacks.
        const [cachedUser, cachedWorkouts] = await Promise.all([
          getProfileOfflineFirst(userId, (fresh) => { if (isMounted) setUser(fresh); }),
          getWorkoutsOfflineFirst(userId, (fresh) => { if (isMounted) setWorkouts(fresh); }),
        ]);

        if (!isMounted) return;

        if (cachedUser) setUser(cachedUser);
        if (cachedWorkouts.length > 0) setWorkouts(cachedWorkouts);

        // Keep spinner only while both caches are empty (first launch).
        if (cachedUser || cachedWorkouts.length > 0) setIsLoading(false);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить профиль.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }

      try {
        const userId = await getStoredUserId();
        if (!isMounted || !userId) {
          return;
        }

        setIsLoadingDialogs(true);
        const loadedDialogs = await getChatDialogs(userId);
        if (isMounted) {
          setDialogs(Array.isArray(loadedDialogs) ? loadedDialogs : []);
        }
      } catch {
        if (isMounted) {
          // Chat section is optional for profile screen; keep profile data visible.
          setDialogs([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDialogs(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const primaryWorkout = workouts[0] ?? null;
  const resolveAvatar = (seed: string) => {
    if (!seed) {
      return AVATARS[0];
    }

    const hash = seed
      .split("")
      .reduce((acc, symbol) => acc + symbol.charCodeAt(0), 0);

    return AVATARS[hash % AVATARS.length];
  };

  const getLoginInitial = (login?: string) => {
    const normalized = (login ?? "").trim().replace(/^@+/, "");
    if (!normalized) {
      return "?";
    }

    return normalized[0].toUpperCase();
  };

  const chatItems = dialogs.length
    ? dialogs.map((dialog) => ({
        key: dialog.conversationId,
        name: dialog.peerName,
        login: dialog.peerLogin,
        message: dialog.lastMessageText || "Начните диалог",
        avatar: resolveAvatar(dialog.peerUserId),
        conversationId: dialog.conversationId,
        peerUserId: dialog.peerUserId,
      }))
    : CHAT_PREVIEW.map((chat) => ({
        key: chat.name,
        name: chat.name,
        login: "",
        message: chat.message,
        avatar: chat.avatar,
        conversationId: "",
        peerUserId: "",
      }));

  return (

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 35 }}>
        {isLoading && !user ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
        ) : null}
        
        {error ? (
          <View style={{ backgroundColor: "#FF8A8022", padding: 12, borderRadius: 12, marginBottom: 20 }}>
            <Text style={{ color: "#FF8A80", textAlign: "center" }}>{error}</Text>
          </View>
        ) : null}

        {/* Header Section */}
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <View style={{ position: "relative" }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 3,
                borderColor: colors.accent,
                padding: 4,
                backgroundColor: colors.background,
              }}
            >
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=400&q=80" }}
                style={{ width: "100%", height: "100%", borderRadius: 54 }}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/edit-profile")}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.accent,
                justifyContent: "center",
                alignItems: "center",
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}
            >
              <MaterialIcons name="edit" size={18} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 16 }}>
            {user?.name ?? "Спортсмен"}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 4 }}>
            {user?.login ? `@${user.login}` : "@user"}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 25 }}>
          <View style={{
            backgroundColor: colors.thirdary,
            width: "31%",
            paddingVertical: 15,
            borderRadius: 20,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)"
          }}>
            <MaterialIcons name="cake" size={22} color={colors.accent} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 8 }}>
              {user?.age ?? "—"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Возраст</Text>
          </View>

          <View style={{
            backgroundColor: colors.thirdary,
            width: "31%",
            paddingVertical: 15,
            borderRadius: 20,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)"
          }}>
            <MaterialIcons name="height" size={22} color={colors.accent} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 8 }}>
              {user?.height ? `${user.height}` : "—"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Рост (см)</Text>
          </View>

          <View style={{
            backgroundColor: colors.thirdary,
            width: "31%",
            paddingVertical: 15,
            borderRadius: 20,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)"
          }}>
            <MaterialIcons name="fitness-center" size={22} color={colors.accent} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 8 }}>
              {user?.weight ? `${user.weight}` : "—"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Вес (кг)</Text>
          </View>
        </View>

        {/* Workout Plan Section */}
        <View style={{ marginBottom: 25 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}>
              Мой план
            </Text>

          </View>

          {workouts.length > 0 ? (
            workouts.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={async () => {
                  await setStoredWorkoutId(item.id);
                  router.push(`/training?workoutId=${item.id}`);
                }}
                style={{
                  backgroundColor: colors.thirdary,
                  borderRadius: 24,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.05)"
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>{item.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }} numberOfLines={1}>
                    {item.exercises.length} упражнений • {item.goal}
                  </Text>
                </View>
                
                <View style={{ backgroundColor: colors.accent, width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" }}>
                  <MaterialIcons name="play-arrow" size={24} color="white" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/create-workout")}
              style={{
                backgroundColor: colors.thirdary,
                borderRadius: 24,
                padding: 30,
                alignItems: "center",
                justifyContent: "center",
                borderStyle: "dashed",
                borderWidth: 1,
                borderColor: colors.textSecondary,
              }}
            >
              <MaterialIcons name="add-circle-outline" size={40} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 10, fontWeight: "600" }}>Создать план тренировок</Text>
            </TouchableOpacity>
          )}

          {workouts.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                if (primaryWorkout) {
                  await setStoredWorkoutId(primaryWorkout.id);
                  router.push(`/training?workoutId=${primaryWorkout.id}`);
                }
              }}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 18,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Начать тренировку</Text>
            </TouchableOpacity>
          )}
        </View>

        <View
          style={{
            backgroundColor: colors.thirdary,
            borderRadius: 20,
            padding: 18,
            marginVertical: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <MaterialIcons name="forum" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>Ваши знакомые</Text>
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

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setLogoutModalOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.05)",
            marginBottom: 20,
          }}
        >
          <MaterialIcons name="logout" size={20} color="#FF8A80" style={{ marginRight: 10 }} />
          <Text style={{ color: "#FF8A80", fontSize: 16, fontWeight: "600" }}>
            Выйти из аккаунта
          </Text>
        </TouchableOpacity>

        <Modal transparent visible={isLogoutModalOpen} animationType="fade" onRequestClose={() => setLogoutModalOpen(false)}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setLogoutModalOpen(false)}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", paddingHorizontal: 30 }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={{
                backgroundColor: colors.thirdary,
                borderRadius: 22,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "#FF8A8022",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <MaterialIcons name="logout" size={28} color="#FF8A80" />
              </View>

              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
                Выход
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", marginBottom: 24, lineHeight: 21 }}>
                Вы уверены, что хотите выйти из аккаунта?
              </Text>

              <View style={{ flexDirection: "row", gap: 12, alignSelf: "stretch" }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setLogoutModalOpen(false)}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: colors.secondary }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>Отмена</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    void handleLogout();
                  }}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#FF8A80" }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Выйти</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </ScrollView>

  );
}
