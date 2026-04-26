import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ASSIGNED_WORKOUT_NOTIFICATION_IDS_KEY } from "@/services/storage";

type NotificationMap = Record<string, string[]>;

let isConfigured = false;

function configureNotifications() {
  if (isConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  isConfigured = true;
}

async function ensurePermission() {
  configureNotifications();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("training-reminders", {
    name: "Training reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3D8BFF",
  });
}

async function readMap() {
  const raw = await AsyncStorage.getItem(ASSIGNED_WORKOUT_NOTIFICATION_IDS_KEY);
  if (!raw) {
    return {} as NotificationMap;
  }

  try {
    const parsed = JSON.parse(raw) as NotificationMap;
    return parsed && typeof parsed === "object" ? parsed : ({} as NotificationMap);
  } catch {
    return {} as NotificationMap;
  }
}

async function writeMap(map: NotificationMap) {
  await AsyncStorage.setItem(ASSIGNED_WORKOUT_NOTIFICATION_IDS_KEY, JSON.stringify(map));
}

export async function scheduleAssignedWorkoutNotifications(input: {
  scheduleId: string;
  contactName: string;
  scheduledAt: string;
}) {
  const scheduledDate = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    return;
  }

  const map = await readMap();
  if (Array.isArray(map[input.scheduleId]) && map[input.scheduleId].length > 0) {
    return;
  }

  const hasPermission = await ensurePermission();
  if (!hasPermission) {
    return;
  }

  await ensureAndroidChannel();

  const now = new Date();
  const notificationIds: string[] = [];

  const morningReminder = new Date(scheduledDate);
  morningReminder.setHours(7, 0, 0, 0);

  if (morningReminder.getTime() > now.getTime()) {
    const morningId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Тренировка сегодня",
        body: `У вас тренировка с ${input.contactName}. Не забудьте подготовиться.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: morningReminder,
        channelId: "training-reminders",
      },
    });
    notificationIds.push(morningId);
  }

  const preWorkoutReminder = new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000);
  if (preWorkoutReminder.getTime() > now.getTime()) {
    const timeLabel = `${String(scheduledDate.getHours()).padStart(2, "0")}:${String(scheduledDate.getMinutes()).padStart(2, "0")}`;
    const preWorkoutId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Скоро тренировка",
        body: `Через 2 часа тренировка с ${input.contactName} (${timeLabel}).`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: preWorkoutReminder,
        channelId: "training-reminders",
      },
    });
    notificationIds.push(preWorkoutId);
  }

  if (notificationIds.length === 0) {
    return;
  }

  map[input.scheduleId] = notificationIds;
  await writeMap(map);
}
