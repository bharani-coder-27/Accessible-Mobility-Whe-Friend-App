/* import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

export default function App() {
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE} // Use Google Maps
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
}); */






import { Redirect } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "../src/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/Auth/LoginScreen" />;
  }

  if (user.role === "passenger") {
    return <Redirect href="/Passenger/PassengerHomeScreen" />;
  }

  return <Redirect href="/Conductor/ConductorHomeScreen" />;
}