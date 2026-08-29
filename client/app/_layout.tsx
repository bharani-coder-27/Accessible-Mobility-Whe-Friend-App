import React, { useContext, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";

import { AuthProvider, AuthContext } from "../src/contexts/AuthContext";
import { LanguageProvider } from "../src/contexts/LanguageContext";
import { ThemeProvider, useTheme } from "../src/theme";
import { toastConfig } from "../src/components/ui/AppToast";
import { setupNotificationHandler } from "../src/utils/notificationHandler";
import { loadServerBase } from "../src/services/serverConfig";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* The splash screen may already be hidden on a fast reload. */
});

// Applied before React renders, so the very first request already goes to the
// server the user chose rather than the one baked in at build time.
const serverReady = loadServerBase();

function RootNavigator() {
  const { user, loading } = useContext(AuthContext);
  const theme = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentSegment = segments[0]?.toLowerCase();
    const inAuthGroup = currentSegment === "auth";
    // Settings holds the server-address field. It must stay reachable while
    // signed out — otherwise a wrong default address locks the user out of
    // the one screen that could fix it.
    const isPublicScreen = inAuthGroup || currentSegment === "settings";

    if (!user && !isPublicScreen) {
      router.replace("/Auth/LoginScreen");
    } else if (user && inAuthGroup) {
      router.replace(user.role === "passenger" ? "/Passenger" : "/Conductor/waiting");
    }
  }, [user, segments, loading, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
        // Sliding screens can be disorienting for vestibular sensitivity, so
        // reduce-motion swaps the push transition for a plain fade.
        animation: theme.reduceMotion ? "fade" : "slide_from_right",
      }}
    />
  );
}

/**
 * Holds the splash screen until both the fonts and the stored session have
 * resolved, so the app never flashes a signed-out screen at a signed-in user
 * or a fallback font before Inter loads.
 */
function AppGate() {
  const { loading } = useContext(AuthContext);
  const theme = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [serverLoaded, setServerLoaded] = useState(false);
  useEffect(() => {
    serverReady.finally(() => setServerLoaded(true));
  }, []);

  const ready = (fontsLoaded || !!fontError) && !loading && serverLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Installed once for the life of the app, not per screen, so a tap on a
  // notification is handled wherever the user happens to be.
  useEffect(() => setupNotificationHandler(), []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;

  return <RootNavigator />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <AppGate />
              <Toast config={toastConfig} position="top" topOffset={56} />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
