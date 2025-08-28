// app/_layout.tsx
/* import React from "react";
import { Stack } from "expo-router";
import { SafeAreaView, StatusBar } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#6200EE" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </SafeAreaView>
  );
}

 */


import React, { useContext, useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, AuthContext } from "../src/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";

function RootNavigator() {
  const { user, loading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0]?.toLowerCase() === "auth";

    if (!user && !inAuthGroup) {
      router.replace("/Auth/LoginScreen");
    } else if (user && inAuthGroup) {
      if (user.role === "passenger") {
        router.replace("/Passenger/PassengerHomeScreen");
      } else {
        router.replace("/Conductor/ConductorHomeScreen");
      }
    }
  }, [user, segments, loading, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}