import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="PassengerHomeScreen"
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="TrackingScreen"
        options={{ title: 'Track Your Journey' }}
      />
    </Stack>
  );
}
