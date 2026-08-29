import React, { useContext, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { BusStop, BusTiming, Coordinates } from "../../src/types";
import { AuthContext } from "../../src/contexts/AuthContext";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useTheme } from "../../src/theme";
import api, { errorMessage } from "../../src/services/api";
import { formatTime } from "../../src/utils/validation";
import {
  AppBar,
  Badge,
  EmptyState,
  Screen,
  StepIndicator,
  Text,
} from "../../src/components/ui";

const parseParam = <T,>(value: string | string[] | undefined, fallback: T): T => {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export default function BusTimingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const theme = useTheme();

  const selectedStop = parseParam<BusStop | null>(params.selectedStop, null);
  const timings = parseParam<BusTiming[]>(params.timings, []);
  const fromCoords = parseParam<Coordinates | null>(params.fromCoords, null);
  const toCoords = parseParam<Coordinates | null>(params.toCoords, null);

  const [notifyingBusId, setNotifyingBusId] = useState<number | null>(null);

  const selectBus = async (bus: BusTiming) => {
    if (!selectedStop || !user) return;

    setNotifyingBusId(bus.bus_id);
    try {
      await api.post("/notify", {
        bus_id: bus.bus_id,
        bus_stop_id: selectedStop.id,
        user_id: user.id,
        timing: bus.arrival_time,
        message: `Passenger ${user.name} is waiting at ${selectedStop.stop_name} for bus ${bus.bus_name}`,
      });

      Toast.show({ type: "success", text1: t("conductorNotified") });

      router.push({
        pathname: "/Passenger/TrackingScreen",
        params: {
          fromLat: fromCoords?.latitude ?? "",
          fromLng: fromCoords?.longitude ?? "",
          destLat: toCoords?.latitude ?? "",
          destLng: toCoords?.longitude ?? "",
          stopName: selectedStop.stop_name,
          busName: bus.bus_name,
        },
      });
    } catch (error) {
      // The server rejects a second active booking for the same bus and stop,
      // which is a normal thing for a user to try, not a system failure.
      const message = errorMessage(error, t("notifyFailed"));
      const isDuplicate = message.toLowerCase().includes("already");

      Toast.show({
        type: isDuplicate ? "info" : "error",
        text1: isDuplicate ? t("alreadyBooked") : t("notifyFailed"),
        text2: isDuplicate ? undefined : message,
      });
    } finally {
      setNotifyingBusId(null);
    }
  };

  return (
    <Screen padded={false}>
      <AppBar title={t("busesTitle")} showBack />

      <View
        style={{
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          gap: theme.spacing.lg,
        }}
      >
        <StepIndicator
          steps={[t("stepPlan"), t("stepStop"), t("stepBus"), t("stepTrack")]}
          current={2}
        />

        <Text variant="title" weight="semibold">
          {t("busesAt", { stop: selectedStop?.stop_name ?? "" })}
        </Text>
      </View>

      <FlatList
        data={timings}
        keyExtractor={(item, index) => `${item.bus_id}-${item.arrival_time}-${index}`}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: theme.spacing.xxxl,
          gap: theme.spacing.md,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="bus-outline"
            title={t("noBuses")}
            description={t("noBusesDesc")}
            actionLabel={t("back")}
            onAction={() => router.back()}
          />
        }
        renderItem={({ item }) => {
          const busy = notifyingBusId === item.bus_id;
          const accessible = item.wheelchair_accessible;

          return (
            <Pressable
              accessibilityRole="button"
              // Spoken as one sentence: which bus, when it arrives, and whether
              // it is accessible — the last being the fact that decides whether
              // this bus is usable at all.
              accessibilityLabel={[
                item.bus_name,
                item.trip_code,
                t("arrivesAt", { time: formatTime(item.arrival_time) }),
                accessible ? t("wheelchairAccessible") : t("notAccessible"),
              ]
                .filter(Boolean)
                .join(". ")}
              accessibilityHint={t("notifyConductor")}
              accessibilityState={{ busy, disabled: busy }}
              disabled={busy}
              onPress={() => selectBus(item)}
              style={({ pressed }) => [
                {
                  gap: theme.spacing.md,
                  padding: theme.spacing.lg,
                  borderRadius: theme.radius.lg,
                  backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
                  borderWidth: theme.highContrast ? 2 : 1,
                  borderColor: theme.colors.border,
                  opacity: busy ? 0.7 : 1,
                },
                theme.shadow(1),
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: theme.radius.md,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.colors.primarySoft,
                  }}
                >
                  <Ionicons name="bus" size={theme.size("titleLg")} color={theme.colors.primaryText} />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyLg" weight="semibold" numberOfLines={1}>
                    {item.bus_name}
                  </Text>
                  {item.trip_code ? (
                    <Text variant="footnote" tone="muted">
                      {item.trip_code}
                    </Text>
                  ) : null}
                </View>

                {busy ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text variant="title" weight="bold" tone="primary">
                      {formatTime(item.arrival_time)}
                    </Text>
                  </View>
                )}
              </View>

              {/* On its own line so a long label never squeezes the bus name. */}
              <Badge
                label={accessible ? t("wheelchairAccessible") : t("notAccessible")}
                tone={accessible ? "success" : "warning"}
                icon={accessible ? "accessibility" : "alert-circle-outline"}
              />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
