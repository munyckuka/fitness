import * as Network from "expo-network";
import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const POLL_INTERVAL_MS = 10_000;

export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return (state.isConnected ?? false) && (state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const result = await isOnline();
      if (!cancelled) setOnline(result);
    };

    void check();

    const interval = setInterval(() => void check(), POLL_INTERVAL_MS);

    const subscription = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active" && appStateRef.current !== "active") {
        void check();
      }
      appStateRef.current = next;
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return online;
}
