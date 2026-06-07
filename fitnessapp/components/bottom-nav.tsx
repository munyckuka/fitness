import { FontAwesome5, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { colors } from "../app/theme";
import { useSyncStatus } from "@/services/sync-service";

const IconComponents = {
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5,
};

const NAV_ITEMS = [
  { key: "workouts", iconType: "MaterialCommunityIcons", iconName: "dumbbell", route: "/workouts" },
  { key: "progress", iconType: "MaterialCommunityIcons", iconName: "chart-bar", route: "/progress" },
  { key: "home", iconType: "MaterialIcons", iconName: "home", route: "/" },
  { key: "community", iconType: "MaterialCommunityIcons", iconName: "map", route: "/community" },
  { key: "profile", iconType: "FontAwesome5", iconName: "user", route: "/profile" },
] as const;

const SYNC_DOT_COLOR: Record<string, string> = {
  syncing: colors.accent,
  error: "#FF8A80",
  idle: "#FFA040",
};

export function BottomNav() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments.length > 0 ? `/${segments[0]}` : "/";
  const { status, pendingCount } = useSyncStatus();

  const showDot = pendingCount > 0 || status === "syncing" || status === "error";
  const dotColor = SYNC_DOT_COLOR[status] ?? SYNC_DOT_COLOR.idle;

  return (
    <View
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 35,
        height: 68,
        borderRadius: 28,
        backgroundColor: colors.secondary,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      {NAV_ITEMS.map((item: typeof NAV_ITEMS[number]) => {
        const Icon = IconComponents[item.iconType];
        const isActive = item.route === currentRoute;

        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            onPress={() => { if (!isActive) router.push(item.route); }}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Icon name={item.iconName} size={22} color={isActive ? colors.accent : colors.textSecondary} />
          </TouchableOpacity>
        );
      })}

      {showDot ? (
        <View
          style={{
            position: "absolute",
            top: 10,
            right: 16,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dotColor,
          }}
        />
      ) : null}
    </View>
  );
}
