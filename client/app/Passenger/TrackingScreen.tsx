import React, { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import axios from "axios";
import Toast from "react-native-toast-message";

import { Coordinates } from "../../src/types";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useTheme } from "../../src/theme";
import { googleMapsApiKey, hasGoogleMapsApiKey } from "../../src/config";
import MapSection from "./passComponents/MapSection";
import {
  AppBar,
  Badge,
  Button,
  EmptyState,
  Screen,
  StepIndicator,
  Text,
} from "../../src/components/ui";

/**
 * How close counts as "arrived", in metres.
 *
 * 50 m balances consumer GPS accuracy (5–20 m in the open, worse between
 * buildings) against the spacing of bus stops, so the arrival fires once and
 * at roughly the right place.
 */
const ARRIVAL_RADIUS_METRES = 50;

/** Great-circle distance between two points, in metres. */
const distanceBetween = (a: Coordinates, b: Coordinates): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371e3;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/** Decode a Google encoded polyline into coordinates. */
const decodePolyline = (encoded: string): Coordinates[] => {
  const coordinates: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    coordinates.push({ latitude: lat * 1e-5, longitude: lng * 1e-5 });
  }

  return coordinates;
};

const readCoordinate = (value: string | string[] | undefined): number =>
  typeof value === "string" ? parseFloat(value) : NaN;

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const theme = useTheme();

  const destination = {
    latitude: readCoordinate(params.destLat),
    longitude: readCoordinate(params.destLng),
  };
  const origin = {
    latitude: readCoordinate(params.fromLat),
    longitude: readCoordinate(params.fromLng),
  };

  const hasDestination = !Number.isNaN(destination.latitude) && !Number.isNaN(destination.longitude);
  const hasOrigin = !Number.isNaN(origin.latitude) && !Number.isNaN(origin.longitude);

  const [permission, setPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    hasOrigin ? origin : null
  );
  const [route, setRoute] = useState<Coordinates[]>([]);
  const [arrived, setArrived] = useState(false);

  const watcher = useRef<Location.LocationSubscription | null>(null);
  const routeRequested = useRef(false);
  const arrivedRef = useRef(false);

  const remainingMetres =
    currentLocation && hasDestination ? distanceBetween(currentLocation, destination) : null;

  const readableDistance =
    remainingMetres === null
      ? null
      : remainingMetres >= 1000
        ? `${(remainingMetres / 1000).toFixed(1)} km`
        : `${Math.round(remainingMetres)} m`;

  const fetchRoute = useCallback(
    async (start: Coordinates) => {
      if (!hasGoogleMapsApiKey || !hasDestination || routeRequested.current) return;
      routeRequested.current = true;

      try {
        const { data } = await axios.get(
          "https://maps.googleapis.com/maps/api/directions/json",
          {
            params: {
              origin: `${start.latitude},${start.longitude}`,
              destination: `${destination.latitude},${destination.longitude}`,
              key: googleMapsApiKey,
              mode: "transit",
              departure_time: "now",
            },
          }
        );

        if (data.status === "OK") {
          setRoute(decodePolyline(data.routes[0].overview_polyline.points));
        } else {
          // A missing transit route is normal on routes the operator has not
          // published; the live position and distance still work, so this is a
          // quiet degradation rather than an error the user must dismiss.
          routeRequested.current = data.status !== "ZERO_RESULTS";
        }
      } catch {
        routeRequested.current = false;
      }
    },
    [destination.latitude, destination.longitude, hasDestination]
  );

  /** Tear down the location watcher. Safe to call more than once. */
  const stopWatching = useCallback(() => {
    watcher.current?.remove();
    watcher.current = null;
  }, []);

  const endJourney = () => {
    stopWatching();
    router.dismissAll();
    router.replace("/Passenger");
  };

  useEffect(() => {
    if (!hasDestination) return;

    let cancelled = false;

    const begin = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== "granted") {
        setPermission("denied");
        return;
      }
      setPermission("granted");

      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 10000 },
        (position) => {
          const next = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(next);
          fetchRoute(next);

          if (arrivedRef.current) return;
          if (distanceBetween(next, destination) <= ARRIVAL_RADIUS_METRES) {
            arrivedRef.current = true;
            setArrived(true);
            stopWatching();

            // Spoken immediately rather than shown only as a toast: a rider
            // who cannot watch the screen still needs to know to get off.
            AccessibilityInfo.announceForAccessibility(t("arrivedMessage"));
            Toast.show({ type: "success", text1: t("arrived"), text2: t("arrivedMessage") });
          }
        }
      );
    };

    begin();

    // Only tears down the watcher. The previous version navigated back from
    // its cleanup, so simply leaving the screen bounced the user twice.
    return () => {
      cancelled = true;
      stopWatching();
    };
  }, [hasDestination, destination.latitude, destination.longitude, fetchRoute, stopWatching, t]);

  if (!hasDestination) {
    return (
      <Screen padded={false}>
        <AppBar title={t("trackingTitle")} showBack />
        <EmptyState
          icon="alert-circle-outline"
          tone="danger"
          title={t("somethingWentWrong")}
          description={t("invalidRoute")}
          actionLabel={t("back")}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (permission === "denied") {
    return (
      <Screen padded={false}>
        <AppBar title={t("trackingTitle")} showBack />
        <EmptyState
          icon="location-outline"
          title={t("locationNeeded")}
          description={t("locationNeededDesc")}
          actionLabel={t("enableLocation")}
          onAction={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermission(status === "granted" ? "granted" : "denied");
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <AppBar title={t("trackingTitle")} showBack />

      <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md }}>
        <StepIndicator
          steps={[t("stepPlan"), t("stepStop"), t("stepBus"), t("stepTrack")]}
          current={3}
        />
      </View>

      <MapSection
        fill
        fromCoords={currentLocation ?? destination}
        toCoords={destination}
        userLocation={currentLocation}
        routeCoordinates={route}
        accessibilityLabel={t("mapRouteLabel", {
          from: t("youAreHere"),
          to: (params.stopName as string) || t("destination"),
        })}
        placeholderText={t("mapUnavailable")}
      />

      {/* The status card carries everything the map conveys visually, as text,
          so the screen is fully usable without seeing the map at all. */}
      <View
        style={{
          gap: theme.spacing.md,
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.surface,
          borderTopWidth: theme.highContrast ? 2 : 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="footnote" tone="muted">
              {t("destination")}
            </Text>
            <Text variant="bodyLg" weight="semibold" numberOfLines={2}>
              {(params.stopName as string) || t("destination")}
            </Text>
          </View>

          {arrived ? (
            <Badge label={t("arrived")} tone="success" icon="checkmark-circle" />
          ) : readableDistance ? (
            <Badge
              label={t("distanceRemaining", { distance: readableDistance })}
              tone="info"
              icon="navigate"
            />
          ) : null}
        </View>

        <Button
          label={t("stopTracking")}
          onPress={endJourney}
          variant={arrived ? "primary" : "outline"}
          icon={arrived ? "checkmark-circle-outline" : "close-circle-outline"}
        />
      </View>
    </Screen>
  );
}
