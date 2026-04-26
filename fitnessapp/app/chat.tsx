import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  connectChatEvents,
  ensureDialog,
  getDialogMessages,
  importSharedWorkout,
  markDialogRead,
  sendDialogMessage,
  type ChatMessage,
  type SharedWorkoutMetadata,
} from "@/services/chat-service";
import { getUserWorkouts, type WorkoutSummary } from "@/services/fitness-service";
import { getStoredUserId } from "@/services/session-service";
import { colors } from "./theme";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function getMonthGrid(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

function formatTime(hour: number, minute: number) {
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `${h}:${m}`;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatar?: string; conversationId?: string; peerUserId?: string }>();
  const contactName = typeof params.name === "string" ? params.name : "Чат";
  const avatar = typeof params.avatar === "string" && params.avatar.trim().length > 0 ? params.avatar : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop";
  const initialConversationId = typeof params.conversationId === "string" ? params.conversationId : "";
  const peerUserId = typeof params.peerUserId === "string" ? params.peerUserId : "";

  const [isActionPopupOpen, setActionPopupOpen] = useState(false);
  const [isSharePopupOpen, setSharePopupOpen] = useState(false);
  const [isAssignPopupOpen, setAssignPopupOpen] = useState(false);
  const [isSharedWorkoutDetailsOpen, setSharedWorkoutDetailsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myWorkouts, setMyWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoadingMyWorkouts, setIsLoadingMyWorkouts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("");
  const [selectedSharedWorkout, setSelectedSharedWorkout] = useState<SharedWorkoutMetadata | null>(null);
  const [isImportingSharedWorkout, setIsImportingSharedWorkout] = useState(false);
  const [isAssigningWorkout, setIsAssigningWorkout] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(0);

  const monthGrid = useMemo(
    () => getMonthGrid(selectedDate.getFullYear(), selectedDate.getMonth()),
    [selectedDate],
  );

  const openShareWorkout = () => {
    setActionPopupOpen(false);
    setSharePopupOpen(true);
    if (!currentUserId || isLoadingMyWorkouts || myWorkouts.length > 0) {
      return;
    }

    setIsLoadingMyWorkouts(true);
    void getUserWorkouts(currentUserId)
      .then((workouts) => {
        setMyWorkouts(workouts);
        if (workouts.length > 0) {
          setSelectedWorkoutId(workouts[0].id);
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить ваши тренировки.");
      })
      .finally(() => {
        setIsLoadingMyWorkouts(false);
      });
  };

  const openAssignWorkout = () => {
    setActionPopupOpen(false);
    setAssignPopupOpen(true);
  };

  const changeMonth = (delta: number) => {
    setSelectedDate((currentDate) => {
      const nextMonthDate = new Date(currentDate);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + delta);
      const daysInNewMonth = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0).getDate();

      if (nextMonthDate.getDate() > daysInNewMonth) {
        nextMonthDate.setDate(daysInNewMonth);
      }

      return nextMonthDate;
    });
  };

  const chooseDay = (day: number) => {
    setSelectedDate((currentDate) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(day);
      return nextDate;
    });
  };

  const changeTime = (mode: "hour" | "minute", delta: number) => {
    if (mode === "hour") {
      setSelectedHour((current) => (current + delta + 24) % 24);
      return;
    }

    setSelectedMinute((current) => (current + delta + 60) % 60);
  };

  const onShareWorkout = () => {
    const workoutToShare = myWorkouts.find((item) => item.id === selectedWorkoutId);
    if (!workoutToShare || !currentUserId || !conversationId) {
      Alert.alert("Нет тренировки", "Выберите тренировку для отправки.");
      return;
    }

    const metadata: SharedWorkoutMetadata = {
      type: "shared_workout",
      title: workoutToShare.title,
      exercises: workoutToShare.exercises.map((exercise) => ({
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscle,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: exercise.restSeconds,
        weight: exercise.weight,
      })),
    };

    setSharePopupOpen(false);
    void sendDialogMessage(currentUserId, conversationId, `Тренировка: ${workoutToShare.title}`, {
      kind: "shared_workout",
      metadata,
    })
      .then(() => loadMessages(false))
      .catch((sendError) => {
        setError(sendError instanceof Error ? sendError.message : "Не удалось отправить тренировку.");
      });
  };

  const onAssignWorkout = async () => {
    if (!currentUserId || !conversationId) {
      Alert.alert("Ошибка", "Не удалось назначить тренировку: диалог не готов.");
      return;
    }

    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(selectedHour, selectedMinute, 0, 0);

    if (Number.isNaN(scheduledAt.getTime())) {
      Alert.alert("Ошибка", "Укажите корректные дату и время.");
      return;
    }

    const now = new Date();
    if (scheduledAt.getTime() <= now.getTime()) {
      Alert.alert("Ошибка", "Выберите дату и время в будущем.");
      return;
    }

    const dateLabel = `${scheduledAt.getDate()} ${MONTH_NAMES[scheduledAt.getMonth()]} ${scheduledAt.getFullYear()}`;
    const timeLabel = formatTime(scheduledAt.getHours(), scheduledAt.getMinutes());

    setIsAssigningWorkout(true);
    try {
      setAssignPopupOpen(false);
      await sendDialogMessage(currentUserId, conversationId, `Тренировка назначена на ${dateLabel} в ${timeLabel}`, {
        kind: "assigned_workout",
        metadata: {
          type: "assigned_workout",
          scheduledAt: scheduledAt.toISOString(),
        },
      });
      await loadMessages(false);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "Не удалось назначить тренировку.");
    } finally {
      setIsAssigningWorkout(false);
    }
  };

  const openSharedWorkoutDetails = (message: ChatMessage) => {
    const metadata = message.metadata;
    if (!metadata || typeof metadata !== "object") {
      return;
    }

    const typed = metadata as SharedWorkoutMetadata;
    if (typed.type !== "shared_workout" || !Array.isArray(typed.exercises)) {
      return;
    }

    setSelectedSharedWorkout(typed);
    setSharedWorkoutDetailsOpen(true);
  };

  const addSharedWorkoutToMe = async () => {
    if (!currentUserId || !selectedSharedWorkout) {
      return;
    }

    setIsImportingSharedWorkout(true);
    try {
      await importSharedWorkout(currentUserId, {
        exercises: selectedSharedWorkout.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          rest: exercise.rest,
          weight: exercise.weight,
        })),
      });

      setSharedWorkoutDetailsOpen(false);
      Alert.alert("Добавлено", "Тренировка добавлена в ваш список.");
    } catch (importError) {
      Alert.alert("Ошибка", importError instanceof Error ? importError.message : "Не удалось добавить тренировку.");
    } finally {
      setIsImportingSharedWorkout(false);
    }
  };

  const loadMessages = useCallback(
    async (displayLoader: boolean) => {
      if (!currentUserId || !conversationId) {
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      if (displayLoader) {
        setIsLoadingMessages(true);
      }

      try {
        const response = await getDialogMessages(currentUserId, conversationId, { limit: 100 });
        setMessages(Array.isArray(response) ? response : []);

        const lastMessage = response.length > 0 ? response[response.length - 1] : null;
        if (lastMessage && lastMessage.senderId !== currentUserId) {
          await markDialogRead(currentUserId, conversationId, lastMessage.id);
        }

        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить сообщения.");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [conversationId, currentUserId],
  );

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const userId = await getStoredUserId();
        if (!isMounted) {
          return;
        }

        if (!userId) {
          setError("Требуется авторизация для чата.");
          setIsLoadingMessages(false);
          return;
        }

        setCurrentUserId(userId);

        if (initialConversationId) {
          setConversationId(initialConversationId);
          return;
        }

        if (peerUserId) {
          const dialog = await ensureDialog(userId, peerUserId);
          if (isMounted) {
            setConversationId(dialog.conversationId);
          }
        } else {
          setIsLoadingMessages(false);
        }
      } catch (initError) {
        if (isMounted) {
          setError(initError instanceof Error ? initError.message : "Не удалось открыть диалог.");
          setIsLoadingMessages(false);
        }
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [initialConversationId, peerUserId]);

  useEffect(() => {
    if (!currentUserId || !conversationId) {
      return;
    }

    void loadMessages(true);

    const pollId = setInterval(() => {
      void loadMessages(false);
    }, 4000);

    let disconnect = () => {};
    void connectChatEvents(
      currentUserId,
      (event) => {
        if (event.conversationId && event.conversationId === conversationId) {
          void loadMessages(false);
        }
      },
      () => {
        // Polling already acts as fallback transport.
      },
    )
      .then((stop) => {
        disconnect = stop;
      })
      .catch(() => {});

    return () => {
      clearInterval(pollId);
      disconnect();
    };
  }, [conversationId, currentUserId, loadMessages]);

  const onSendMessage = async () => {
    const normalizedText = messageText.trim();
    if (!normalizedText || !currentUserId || !conversationId) {
      return;
    }

    try {
      setMessageText("");
      await sendDialogMessage(currentUserId, conversationId, normalizedText);
      await loadMessages(false);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Не удалось отправить сообщение.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
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
          onPress={() => setActionPopupOpen(true)}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.thirdary, alignItems: "center", justifyContent: "center" }}
        >
          <MaterialIcons name="add" size={24} color={colors.textPrimary} />
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
        {error ? <Text style={{ color: "#FF8A80", fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}

        <View style={{ alignSelf: "center", backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 18 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Сегодня</Text>
        </View>

        {isLoadingMessages ? <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>Загрузка сообщений...</Text> : null}

        {!isLoadingMessages && messages.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>Сообщений пока нет.</Text>
        ) : null}

        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          const parsedDate = new Date(message.createdAt);
          const timeLabel = Number.isNaN(parsedDate.getTime()) ? "--:--" : `${String(parsedDate.getHours()).padStart(2, "0")}:${String(parsedDate.getMinutes()).padStart(2, "0")}`;

          return (
            <View
              key={message.id}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                maxWidth: "80%",
                marginBottom: 12,
              }}
            >
              <TouchableOpacity
                activeOpacity={message.kind === "shared_workout" ? 0.85 : 1}
                onPress={() => {
                  if (message.kind === "shared_workout") {
                    openSharedWorkoutDetails(message);
                  }
                }}
                style={{
                  backgroundColor: isMine ? colors.accent : colors.thirdary,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomRightRadius: isMine ? 6 : 20,
                  borderBottomLeftRadius: isMine ? 20 : 6,
                }}
              >
                {message.kind === "shared_workout" ? (
                  <>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 5 }}>Поделился тренировкой</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: "700" }}>{message.text}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>Нажмите, чтобы открыть детали</Text>
                  </>
                ) : message.kind === "assigned_workout" ? (
                  <>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 5 }}>Назначение тренировки</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: "700" }}>{message.text}</Text>
                  </>
                ) : (
                  <Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 21 }}>{message.text}</Text>
                )}
              </TouchableOpacity>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  marginTop: 5,
                  alignSelf: isMine ? "flex-end" : "flex-start",
                }}
              >
                {timeLabel}
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
            editable={Boolean(conversationId && currentUserId)}
            placeholder="Сообщение"
            placeholderTextColor={colors.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            style={{ flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 8 }}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              void onSendMessage();
            }}
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

      <Modal transparent visible={isActionPopupOpen} animationType="fade" onRequestClose={() => setActionPopupOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActionPopupOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", paddingHorizontal: 22 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{ backgroundColor: colors.thirdary, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginBottom: 14 }}>Действия</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openShareWorkout}
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>Поделиться тренировкой</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openAssignWorkout}
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>Назначить тренировку</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal transparent visible={isSharePopupOpen} animationType="slide" onRequestClose={() => setSharePopupOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", paddingHorizontal: 22 }}>
          <View style={{ backgroundColor: colors.thirdary, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", maxHeight: "80%" }}>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginBottom: 4 }}>Выберите тренировку</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 14 }}>Что отправить пользователю {contactName}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isLoadingMyWorkouts ? <Text style={{ color: colors.textSecondary }}>Загрузка...</Text> : null}

              {myWorkouts.map((workout) => {
                const isSelected = selectedWorkoutId === workout.id;

                return (
                  <TouchableOpacity
                    key={workout.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedWorkoutId(workout.id)}
                    style={{
                      borderRadius: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      marginBottom: 10,
                      backgroundColor: isSelected ? colors.accent : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: isSelected ? "700" : "500" }}>{workout.title}</Text>
                  </TouchableOpacity>
                );
              })}

              {!isLoadingMyWorkouts && myWorkouts.length === 0 ? <Text style={{ color: colors.textSecondary }}>У вас пока нет тренировок для отправки.</Text> : null}
            </ScrollView>

            <View style={{ flexDirection: "row", marginTop: 8, columnGap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSharePopupOpen(false)}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600" }}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onShareWorkout}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", backgroundColor: colors.accent }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>Поделиться</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isAssignPopupOpen} animationType="slide" onRequestClose={() => setAssignPopupOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", paddingHorizontal: 22 }}>
          <View style={{ backgroundColor: colors.thirdary, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", maxHeight: "84%" }}>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginBottom: 4 }}>Назначить тренировку</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>Выберите дату и время</Text>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
                <MaterialIcons name="chevron-left" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }}>
                {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => changeMonth(1)} style={{ padding: 8 }}>
                <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              {WEEKDAYS.map((weekday) => (
                <Text key={weekday} style={{ color: colors.textSecondary, fontSize: 12, width: 34, textAlign: "center" }}>
                  {weekday}
                </Text>
              ))}
            </View>

            {monthGrid.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                {week.map((day, dayIndex) => {
                  const isSelected = day !== null && day === selectedDate.getDate();

                  return (
                    <TouchableOpacity
                      key={`day-${weekIndex}-${dayIndex}`}
                      activeOpacity={day === null ? 1 : 0.85}
                      disabled={day === null}
                      onPress={() => {
                        if (day !== null) chooseDay(day);
                      }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected ? colors.accent : "transparent",
                      }}
                    >
                      <Text style={{ color: day === null ? "rgba(255,255,255,0.15)" : colors.textPrimary, fontSize: 13, fontWeight: isSelected ? "700" : "500" }}>
                        {day ?? ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <View style={{ marginTop: 10, marginBottom: 12 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>Время</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 14 }}>
                <View style={{ alignItems: "center" }}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => changeTime("hour", 1)} style={{ padding: 4 }}>
                    <MaterialIcons name="keyboard-arrow-up" size={26} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "700", minWidth: 34, textAlign: "center" }}>
                    {String(selectedHour).padStart(2, "0")}
                  </Text>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => changeTime("hour", -1)} style={{ padding: 4 }}>
                    <MaterialIcons name="keyboard-arrow-down" size={26} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "700" }}>:</Text>

                <View style={{ alignItems: "center" }}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => changeTime("minute", 5)} style={{ padding: 4 }}>
                    <MaterialIcons name="keyboard-arrow-up" size={26} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "700", minWidth: 34, textAlign: "center" }}>
                    {String(selectedMinute).padStart(2, "0")}
                  </Text>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => changeTime("minute", -5)} style={{ padding: 4 }}>
                    <MaterialIcons name="keyboard-arrow-down" size={26} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", columnGap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAssignPopupOpen(false)}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600" }}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onAssignWorkout}
                disabled={isAssigningWorkout}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", backgroundColor: colors.accent, opacity: isAssigningWorkout ? 0.7 : 1 }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>{isAssigningWorkout ? "Назначение..." : "Назначить"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isSharedWorkoutDetailsOpen} animationType="slide" onRequestClose={() => setSharedWorkoutDetailsOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", paddingHorizontal: 22 }}>
          <View style={{ backgroundColor: colors.thirdary, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", maxHeight: "84%" }}>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginBottom: 4 }}>
              {selectedSharedWorkout?.title ?? "Тренировка"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>Детали тренировки</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(selectedSharedWorkout?.exercises ?? []).map((exercise) => (
                <View key={`${exercise.exerciseId}-${exercise.name}`} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10, marginBottom: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>{exercise.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                    {exercise.sets}x{exercise.reps} • отдых {exercise.rest}с • вес {exercise.weight ?? 0}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", columnGap: 10, marginTop: 10 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSharedWorkoutDetailsOpen(false)}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600" }}>Закрыть</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isImportingSharedWorkout}
                onPress={() => {
                  void addSharedWorkoutToMe();
                }}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", backgroundColor: colors.accent, opacity: isImportingSharedWorkout ? 0.7 : 1 }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>{isImportingSharedWorkout ? "Добавление..." : "Добавить себе"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}