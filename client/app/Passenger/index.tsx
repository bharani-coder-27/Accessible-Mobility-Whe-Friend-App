import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

import { Coordinates, PlaceSuggestion } from "../../src/types";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useTheme } from "../../src/theme";
import { useDebouncedValue } from "../../src/hooks/useDebouncedValue";
import api, { errorMessage } from "../../src/services/api";
import {
  fetchPlaceSuggestions,
  geocodeAddress,
  getCurrentLocation,
} from "../../src/services/googleApi";
import LocationInput from "./passComponents/LocationInput";
import MapSection from "./passComponents/MapSection";
import {
  AppBar,
  Button,
  Card,
  IconButton,
  Screen,
  StepIndicator,
  Text,
} from "../../src/components/ui";

const SEARCH_RADIUS_METRES = 5000;

export default function PassengerHomeScreen() {
  const { t } = useLanguage();
  const theme = useTheme();

  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromCoords, setFromCoords] = useState<Coordinates | null>(null);
  const [toCoords, setToCoords] = useState<Coordinates | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});
  const [searching, setSearching] = useState(false);

  // Only the field the user is actively editing should query for suggestions,
  // otherwise selecting a starting point re-opens the destination list.
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const debouncedFrom = useDebouncedValue(fromAddress);
  const debouncedTo = useDebouncedValue(toAddress);

  useEffect(() => {
    if (activeField !== "from" || debouncedFrom.trim().length < 2) {
      setFromSuggestions([]);
      return;
    }

    let cancelled = false;
    fetchPlaceSuggestions(debouncedFrom).then((results) => {
      if (!cancelled) setFromSuggestions(results);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedFrom, activeField]);

  useEffect(() => {
    if (activeField !== "to" || debouncedTo.trim().length < 2) {
      setToSuggestions([]);
      return;
    }

    let cancelled = false;
    fetchPlaceSuggestions(debouncedTo).then((results) => {
      if (!cancelled) setToSuggestions(results);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedTo, activeField]);

  const handleUseCurrentLocation = useCallback(async () => {
    const result = await getCurrentLocation();
    if (!result) return;

    setFromCoords(result.coords);
    if (result.address) setFromAddress(result.address);
    setActiveField(null);
    setFromSuggestions([]);
    setErrors((prev) => ({ ...prev, from: undefined }));
  }, []);

  const selectSuggestion = async (field: "from" | "to", description: string) => {
    const coords = await geocodeAddress(description);

    if (field === "from") {
      setFromAddress(description);
      setFromCoords(coords);
      setFromSuggestions([]);
      setErrors((prev) => ({ ...prev, from: undefined }));
    } else {
      setToAddress(description);
      setToCoords(coords);
      setToSuggestions([]);
      setErrors((prev) => ({ ...prev, to: undefined }));
    }

    setActiveField(null);
  };

  /** Swap the two endpoints, including whatever coordinates are resolved. */
  const swapEndpoints = () => {
    setFromAddress(toAddress);
    setToAddress(fromAddress);
    setFromCoords(toCoords);
    setToCoords(fromCoords);
    setActiveField(null);
    setFromSuggestions([]);
    setToSuggestions([]);
  };

  const findNearbyStops = async () => {
    setSearching(true);
    try {
      // The user may have typed an address without picking a suggestion, so
      // resolve anything still missing before deciding the form is incomplete.
      let resolvedFrom = fromCoords;
      let resolvedTo = toCoords;

      if (fromAddress.trim() && !resolvedFrom) {
        resolvedFrom = await geocodeAddress(fromAddress);
        setFromCoords(resolvedFrom);
      }
      if (toAddress.trim() && !resolvedTo) {
        resolvedTo = await geocodeAddress(toAddress);
        setToCoords(resolvedTo);
      }

      const nextErrors = {
        from: resolvedFrom ? undefined : t("needFrom"),
        to: resolvedTo ? undefined : t("needTo"),
      };
      setErrors(nextErrors);
      if (!resolvedFrom || !resolvedTo) return;

      const { data } = await api.get("/buses/bus_stops", {
        params: {
          latitude: resolvedFrom.latitude,
          longitude: resolvedFrom.longitude,
          radius: SEARCH_RADIUS_METRES,
          city: "Coimbatore",
        },
      });

      router.push({
        pathname: "/Passenger/NearbyStopsModal",
        params: {
          fromAddress,
          toAddress,
          stops: JSON.stringify(data ?? []),
          fromCoords: JSON.stringify(resolvedFrom),
          toCoords: JSON.stringify(resolvedTo),
        },
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("stopsError"),
        text2: errorMessage(error, t("checkConnection")),
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <Screen scroll padded={false} contentStyle={{ paddingBottom: theme.spacing.xxxl }}>
      <AppBar
        title={t("appName")}
        actions={
          <IconButton
            icon="settings-outline"
            label={t("settings")}
            onPress={() => router.push("/settings")}
          />
        }
      />

      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.xl }}>
        <StepIndicator
          steps={[t("stepPlan"), t("stepStop"), t("stepBus"), t("stepTrack")]}
          current={0}
        />

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="titleLg" weight="bold">
            {t("planTitle")}
          </Text>
          <Text variant="body" tone="muted">
            {t("planSubtitle")}
          </Text>
        </View>

        <Card style={{ gap: theme.spacing.lg }}>
          <LocationInput
            label={t("from")}
            icon="radio-button-on-outline"
            value={fromAddress}
            onChange={(text) => {
              setFromAddress(text);
              setActiveField("from");
              setFromCoords(null);
            }}
            suggestions={fromSuggestions}
            onSelect={(description) => selectSuggestion("from", description)}
            onUseCurrentLocation={handleUseCurrentLocation}
            currentLocationLabel={t("currentLocation")}
            resolved={!!fromCoords}
            error={errors.from}
          />

          <View style={{ alignItems: "flex-end" }}>
            <IconButton
              icon="swap-vertical"
              label={t("swapLocations")}
              tone="primary"
              onPress={swapEndpoints}
            />
          </View>

          <LocationInput
            label={t("to")}
            icon="location-outline"
            value={toAddress}
            onChange={(text) => {
              setToAddress(text);
              setActiveField("to");
              setToCoords(null);
            }}
            suggestions={toSuggestions}
            onSelect={(description) => selectSuggestion("to", description)}
            resolved={!!toCoords}
            error={errors.to}
          />
        </Card>

        <Button
          label={t("findStops")}
          onPress={findNearbyStops}
          loading={searching}
          size="lg"
          icon="search"
          hint={t("selectStopHint")}
        />

        {fromCoords ? (
          <MapSection
            fromCoords={fromCoords}
            toCoords={toCoords}
            accessibilityLabel={t("mapRouteLabel", {
              from: fromAddress || t("from"),
              to: toAddress || t("to"),
            })}
            placeholderText={t("mapUnavailable")}
          />
        ) : null}
      </View>
    </Screen>
  );
}
