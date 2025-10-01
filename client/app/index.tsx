/* import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 11.0168,     // Example: Coimbatore, India
          longitude: 76.9558,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        provider="google"  // Forces Google Maps provider
      >
        <Marker
          coordinate={{ latitude: 11.0168, longitude: 76.9558 }}
          title="My Location"
          description="This is a marker in Coimbatore"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
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

  if (!user) return <Redirect href="/Auth/LoginScreen" />;

  // Correct paths
  if (user.role === "passenger") return <Redirect href="/Passenger" />;
  return <Redirect href="/Conductor/waiting" />;
}
