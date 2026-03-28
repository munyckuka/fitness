import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { BottomNav } from "../components/bottom-nav";
import { HAS_LAUNCHED_KEY, IS_REGISTERED_KEY } from "@/services/storage";
import { colors } from "./theme";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isBootstrapDone, setIsBootstrapDone] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem(HAS_LAUNCHED_KEY);
        const isRegistered = await AsyncStorage.getItem(IS_REGISTERED_KEY);
        const isFirstLaunch = hasLaunched !== "true";
        const registered = isRegistered === "true";

        if (isFirstLaunch && !registered) {
          await AsyncStorage.setItem(HAS_LAUNCHED_KEY, "true");
          router.replace("/welcome");
        }
      } finally {
        if (isMounted) {
          setIsBootstrapDone(true);
        }
      }
    };

    checkFirstLaunch();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const activeRoute = String(segments.length > 0 ? segments[0] : "");
  const shouldShowBottomNav =
    activeRoute !== "welcome" &&
    activeRoute !== "register" &&
    activeRoute !== "create-workout" &&
    activeRoute !== "chat" &&
    activeRoute !== "edit-profile" &&
    activeRoute !== "training" &&
    activeRoute !== "training-exercise" &&
    activeRoute !== "training-feedback" &&
    isBootstrapDone;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.background } }} />
      {shouldShowBottomNav ? <BottomNav /> : null}
    </View>
  );
}
