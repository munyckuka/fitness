import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 40 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
        {isLoading ? <ActivityIndicator color={colors.accent} style={{ marginBottom: 18 }} /> : null}
        {error ? <Text style={{ color: "#FF8A80", marginBottom: 18 }}>{error}</Text> : null}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <View style={{ flex: 1, paddingRight: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 26, lineHeight: 32, fontWeight: "500" }}>{user?.name ?? "UserName"}</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/edit-profile")}
                style={{
                  marginLeft: 10,
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="edit" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 6 }}>
              {user?.login ? `@${user.login}` : "@login"}
            </Text>

            <Text style={{ color: colors.textSecondary, fontSize: 18, lineHeight: 24, fontWeight: "400" }}>
              {user?.gender ?? "Пол не указан"}{user?.age ? ` ${user.age} лет` : ""}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 18, lineHeight: 24, fontWeight: "400" }}>
              {user?.height ? `${user.height}см.` : "Рост не указан"} {user?.weight ? `${user.weight}кг.` : ""}
            </Text>
          </View>

          <View
            style={{
              width: 116,
              height: 116,
              borderRadius: 58,
              backgroundColor: "#DAD9DF",
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=400&q=80" }}
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        </View>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginBottom: 18 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 22, lineHeight: 28, fontWeight: "500", marginBottom: 18 }}>
            Мой план тренировок:
          </Text>

          {workouts.map((item) => (
            <View key={item.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 20, lineHeight: 26, fontWeight: "500" }}>{item.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 4 }}>
                  {item.goal}, {item.equipment}, {item.exercises.length} упражнений
                </Text>
              </View>

              <View style={{ width: 88, height: 88, borderRadius: 18, overflow: "hidden", backgroundColor: colors.secondary }}>
                {item.exercises[0]?.imageUri ? <Image source={{ uri: item.exercises[0].imageUri }} style={{ width: "100%", height: "100%" }} /> : null}
              </View>
            </View>
          ))}

          {workouts.length === 0 ? <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>План тренировок еще не создан.</Text> : null}

          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/edit-profile")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: colors.secondary,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
                Изменить
              </Text>
              <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                if (!primaryWorkout) {
                  router.push("/create-workout");
                  return;
                }

                await setStoredWorkoutId(primaryWorkout.id);
                router.push(`/training?workoutId=${primaryWorkout.id}`);
              }}
              style={{
                flex: 1.55,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: colors.accent,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
                {primaryWorkout ? "Начать тренировку" : "Создать план"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "500", marginBottom: 14 }}>
            Ваши знакомые
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 6, marginBottom: 16 }}>
            {AVATARS.map((uri, idx) => (
              <View
                key={`${uri}-${idx}`}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  overflow: "hidden",
                  marginRight: 10,
                  backgroundColor: colors.secondary,
                }}
              >
                <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
              </View>
            ))}
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
              <View style={{ width: 64, height: 64, borderRadius: 32, overflow: "hidden", marginRight: 14 }}>
                <Image source={{ uri: chat.avatar }} style={{ width: "100%", height: "100%" }} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "500" }}>{chat.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>{chat.message}</Text>
              </View>

              <Text style={{ color: colors.textSecondary, fontSize: 22 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
              { text: "Отмена", onPress: () => {}, style: "cancel" },
              {
                text: "Выход",
                onPress: async () => {
                  await clearStoredUserId();
                  router.replace("/register");
                },
                style: "destructive",
              },
            ]);
          }}
          style={{
            marginTop: 18,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor: colors.secondary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: "600" }}>
            Выход
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
