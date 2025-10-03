import { Redirect } from "expo-router";
import { useContext, useEffect } from "react";
import { AuthContext } from "../src/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { setupNotificationHandler } from "../src/utils/notificationHandler";
import * as Notifications from "expo-notifications";

export default function Index() {
  const { user, loading } = useContext(AuthContext);

  // Setup notification handler once when the app loads
  useEffect(() => {
    // 🔔 Configure foreground notifications (Step 1)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, // Show alert popup inside the app
        shouldPlaySound: true, // Play system notification sound
        shouldSetBadge: true, // Show app badge count
        shouldShowBanner: true, // 👈 Required in SDK 52+
        shouldShowList: true, // 👈 Required in SDK 52+
      }),
    });

    setupNotificationHandler();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/Auth/LoginScreen" />;

  // Correct paths
  if (user.role === "passenger") return <Redirect href="/Passenger" />;
  return <Redirect href="/Conductor/waiting" />;
}
