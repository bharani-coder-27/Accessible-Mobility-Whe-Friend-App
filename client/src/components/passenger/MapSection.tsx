import React, { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Coordinates } from "../../types";
import { hasGoogleMapsApiKey } from "../../config";
import { useTheme } from "../../theme";
import { Text } from "../ui";

interface Props {
  fromCoords: Coordinates;
  toCoords?: Coordinates | null;
  userLocation?: Coordinates | null;
  routeCoordinates?: Coordinates[];
  height?: number;
  /** Spoken description of what the map is showing. */
  accessibilityLabel: string;
  /** Shown in place of the map when Google Maps is not configured. */
  placeholderText: string;
  style?: ViewStyle;
  fill?: boolean;
}

/**
 * The shared map view.
 *
 * A map is decorative for a screen reader user — the meaningful content is the
 * addresses and distances rendered as text around it — so the map itself is a
 * single labelled image node rather than a pile of unreachable markers.
 */
const MapSection = ({
  fromCoords,
  toCoords,
  userLocation,
  routeCoordinates = [],
  height = 260,
  accessibilityLabel,
  placeholderText,
  style,
  fill = false,
}: Props) => {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);

  // Frame every point of interest instead of guessing a zoom level, so the
  // destination is never just off-screen.
  useEffect(() => {
    const points = [fromCoords, toCoords, userLocation].filter(Boolean) as Coordinates[];
    if (points.length < 2 || !mapRef.current) return;

    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: !theme.reduceMotion,
    });
  }, [fromCoords, toCoords, userLocation, theme.reduceMotion]);

  const frame: ViewStyle = {
    ...(fill ? { flex: 1 } : { height }),
    borderRadius: fill ? 0 : theme.radius.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: fill ? 0 : theme.highContrast ? 2 : 1,
    borderColor: theme.colors.border,
  };

  // Without a key the Google tile layer renders as a blank grey rectangle with
  // no explanation, which reads as a broken app. Say so instead.
  if (!hasGoogleMapsApiKey) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={placeholderText}
        style={[
          frame,
          { alignItems: "center", justifyContent: "center", gap: theme.spacing.sm, padding: theme.spacing.xl },
        ]}
      >
        <Ionicons name="map-outline" size={32} color={theme.colors.textMuted} />
        <Text variant="footnote" tone="muted" center>
          {placeholderText}
        </Text>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[frame, style]}
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: fromCoords.latitude,
          longitude: fromCoords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        <Marker coordinate={fromCoords} pinColor={theme.colors.success} />
        {toCoords && <Marker coordinate={toCoords} pinColor={theme.colors.danger} />}
        {userLocation && <Marker coordinate={userLocation} pinColor={theme.colors.primary} />}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeColor={theme.colors.route} strokeWidth={5} />
        )}
      </MapView>
    </View>
  );
};

export default MapSection;
