import { FontAwesome5, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { colors } from "../app/theme";

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

export function BottomNav() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments.length > 0 ? `/${segments[0]}` : "/";
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

    </View>
  );
}
