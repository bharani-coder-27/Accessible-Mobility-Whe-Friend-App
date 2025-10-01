import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Home', headerShown: false }}
      />
      <Stack.Screen
        name="TrackingScreen"
        options={{ title: 'Track Your Journey', headerShown: false }}
      />
      <Stack.Screen
        name="NearbyStopsModal"
        options={{ title: 'NearByStops', headerShown: false}}
      />
      <Stack.Screen
        name="BusTimingsList"
        options={{ title: 'Bus Timings', headerShown: false}}
      />
    </Stack>
  );
};
