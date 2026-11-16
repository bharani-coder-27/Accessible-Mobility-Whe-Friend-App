import React, { useContext, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { PassengerContext, PassengerStatus } from "../contexts/PassengerContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../theme";
import { formatTime } from "../utils/validation";
import {
  AppBar,
  Avatar,
  Badge,
  Button,
  EmptyState,
  Screen,
  SkeletonRow,
  Text,
} from "./ui";

interface Props {
  status: PassengerStatus;
}

/**
 * The conductor's list of passengers in one state.
 *
 * Lives in src/components rather than app/components: anything under app/ is
 * a route in expo-router, so the old location quietly published this list, the
 * header and the profile screen as navigable URLs.
 */
export const PassengerList = ({ status }: Props) => {
  const { passengers, loading, failed, updatingId, fetchPassengers, updateStatus } =
    useContext(PassengerContext);
  const { t } = useLanguage();
  const theme = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const filtered = passengers.filter((item) => item.status === status);

  const title = {
    waiting: t("waiting"),
    traveling: t("traveling"),
    completed: t("completed"),
  }[status];

  const empty = {
    waiting: { title: t("noWaiting"), description: t("noWaitingDesc"), icon: "people-outline" },
    traveling: { title: t("noTraveling"), description: t("noTravelingDesc"), icon: "bus-outline" },
    completed: {
      title: t("noCompleted"),
      description: t("noCompletedDesc"),
      icon: "checkmark-done-outline",
    },
  }[status] as { title: string; description: string; icon: "people-outline" };

  const actionLabel = status === "waiting" ? t("startTravel") : t("completeTrip");
  const actionHint = status === "waiting" ? t("startTravelHint") : t("completeTripHint");

  const refresh = async () => {
    setRefreshing(true);
    await fetchPassengers();
    setRefreshing(false);
  };

  return (
    <Screen padded={false} edges={["top"]}>
      <AppBar
        title={title}
        subtitle={t("passengerCount", { count: filtered.length })}
        actions={
          <Badge
            label={String(filtered.length)}
            tone={status === "waiting" && filtered.length > 0 ? "warning" : "neutral"}
          />
        }
      />

      {loading ? (
        <View>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            padding: theme.spacing.xl,
            paddingBottom: theme.spacing.huge,
            gap: theme.spacing.md,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
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
                onAction={fetchPassengers}
              />
            ) : (
              <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />
            )
          }
          renderItem={({ item }) => (
            <View
              // One node per passenger, so a screen reader reads who is waiting,
              // where and when as a single sentence before reaching the action.
              accessible
              accessibilityLabel={[
                item.passenger_name,
                item.bus_stop_name ? t("boardingAt", { stop: item.bus_stop_name }) : "",
                item.timing ? formatTime(item.timing) : "",
              ]
                .filter(Boolean)
                .join(". ")}
              style={[
                {
                  gap: theme.spacing.md,
                  padding: theme.spacing.lg,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.surface,
                  borderWidth: theme.highContrast ? 2 : 1,
                  borderColor: theme.colors.border,
                },
                theme.shadow(1),
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
                <Avatar name={item.passenger_name} />

                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyLg" weight="semibold" numberOfLines={1}>
                    {item.passenger_name}
                  </Text>
                  {item.bus_stop_name ? (
                    <Text variant="footnote" tone="muted" numberOfLines={1}>
                      {t("boardingAt", { stop: item.bus_stop_name })}
                    </Text>
                  ) : null}
                </View>

                {item.timing ? (
                  <Badge label={formatTime(item.timing)} tone="primary" icon="time-outline" />
                ) : null}
              </View>

              <Badge
                label={
                  item.payment?.status !== "paid"
                    ? t("notPaid")
                    : item.payment.method === "gpay"
                      ? t("paidViaGPay")
                      : t("paidInCash")
                }
                tone={item.payment?.status === "paid" ? "success" : "warning"}
                icon={item.payment?.status === "paid" ? "checkmark-circle" : "alert-circle-outline"}
              />

              {status !== "completed" ? (
                <Button
                  label={actionLabel}
                  hint={actionHint}
                  onPress={() => updateStatus(item.id)}
                  loading={updatingId === item.id}
                  disabled={updatingId !== null && updatingId !== item.id}
                  variant={status === "waiting" ? "primary" : "secondary"}
                  icon={status === "waiting" ? "play-outline" : "checkmark-outline"}
                />
              ) : (
                <Badge label={t("statusCompleted")} tone="success" icon="checkmark-circle" />
              )}
            </View>
          )}
        />
      )}
    </Screen>
  );
};

export default PassengerList;
