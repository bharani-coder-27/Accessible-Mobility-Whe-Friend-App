import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { Trip, TripStatus } from "../../src/types";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useTheme } from "../../src/theme";
import api from "../../src/services/api";
import { formatTime } from "../../src/utils/validation";
import {
  AppBar,
  Badge,
  BadgeTone,
  Divider,
  EmptyState,
  ListRow,
  Screen,
  SkeletonRow,
} from "../../src/components/ui";

const statusTone: Record<TripStatus, BadgeTone> = {
  waiting: "warning",
  traveling: "info",
  completed: "success",
};

const statusIcon: Record<TripStatus, "hourglass-outline" | "bus" | "checkmark-circle"> = {
  waiting: "hourglass-outline",
  traveling: "bus",
  completed: "checkmark-circle",
};

export default function TripsScreen() {
  const { t } = useLanguage();
  const theme = useTheme();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Trip[]>("/notify/history");
      setTrips(Array.isArray(data) ? data : []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch on focus rather than on mount only, so a trip booked in this
  // session is already here when the user switches to the tab.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const statusLabel = (status: TripStatus) =>
    ({
      waiting: t("statusWaiting"),
      traveling: t("statusTraveling"),
      completed: t("statusCompleted"),
    })[status];

  return (
    <Screen padded={false}>
      <AppBar title={t("tripsTitle")} />

      {loading ? (
        <View>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <Divider inset={theme.spacing.xl} />}
          contentContainerStyle={{ paddingBottom: theme.spacing.xxxl, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            failed ? (
              <EmptyState
                icon="cloud-offline-outline"
                tone="danger"
                title={t("somethingWentWrong")}
                description={t("checkConnection")}
                actionLabel={t("retry")}
                onAction={load}
              />
            ) : (
              <EmptyState icon="time-outline" title={t("noTrips")} description={t("noTripsDesc")} />
            )
          }
          renderItem={({ item }) => (
            <ListRow
              icon="bus"
              title={item.bus_name ?? t("busesTitle")}
              subtitle={[
                item.bus_stop_name ? t("boardingAt", { stop: item.bus_stop_name }) : null,
                item.timing ? formatTime(item.timing) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              accessibilityLabel={[
                item.bus_name ?? t("busesTitle"),
                item.bus_stop_name ? t("boardingAt", { stop: item.bus_stop_name }) : "",
                statusLabel(item.status),
              ]
                .filter(Boolean)
                .join(". ")}
              trailing={
                <Badge
                  label={statusLabel(item.status)}
                  tone={statusTone[item.status]}
                  icon={statusIcon[item.status]}
                />
              }
            />
          )}
        />
      )}
    </Screen>
  );
}
