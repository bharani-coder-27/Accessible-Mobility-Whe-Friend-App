import React, { useCallback, useState } from "react";
import { Alert, Linking, RefreshControl, SectionList, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { Trip, TripStatus } from "../../src/types";
import { AuthContext } from "../../src/contexts/AuthContext";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useTheme } from "../../src/theme";
import api, { errorMessage } from "../../src/services/api";
import { formatTime } from "../../src/utils/validation";
import {
  AppBar,
  Badge,
  BadgeTone,
  Button,
  Divider,
  EmptyState,
  ListRow,
  Screen,
  SkeletonRow,
  Text,
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

const paymentFor = (trip: Trip) =>
  trip.payment ?? { amount: 0, method: "cash" as const, status: "paid" as const };

export default function TripsScreen() {
  const { user } = React.useContext(AuthContext);
  const { t } = useLanguage();
  const theme = useTheme();
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [receiptId, setReceiptId] = useState<number | null>(null);

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

  const updatePayment = async (trip: Trip, method: "cash" | "gpay") => {
    setPayingId(trip.id);
    try {
      await api.put("/notify/payment", { notification_id: trip.id, method });
      await load();
    } catch (error) {
      Alert.alert(t("somethingWentWrong"), errorMessage(error, t("paymentFailed")));
    } finally {
      setPayingId(null);
    }
  };

  const downloadReceipt = async (trip: Trip) => {
    setReceiptId(trip.id);
    const payment = paymentFor(trip);
    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character);

    try {
      const html = `
        <html>
          <body style="font-family: Arial; padding: 24px; color: #17212b;">
            <h2>Whe Friend</h2>
            <p><strong>Payment receipt</strong></p>
            <hr />
            <p>Passenger: ${escapeHtml(user?.name ?? "-")}</p>
            <p>Bus: ${escapeHtml(trip.bus_name ?? t("busesTitle"))}</p>
            <p>Route: ${escapeHtml(trip.bus_stop_name ?? "-")}</p>
            <p>Trip code: ${escapeHtml(trip.trip_code ?? "-")}</p>
            <p>Payment method: ${escapeHtml(
              payment.method === "gpay" ? t("paidViaGPay") : t("paidInCash")
            )}</p>
            <h3>Fare: ₹${payment.amount.toFixed(2)}</h3>
            <p>Thank you for travelling with Whe Friend.</p>
          </body>
        </html>`;
      const { uri } = await Print.printToFileAsync({ html });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t("receiptReady"), uri);
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: t("downloadReceipt") });
    } catch (error) {
      Alert.alert(t("somethingWentWrong"), errorMessage(error, t("receiptFailed")));
    } finally {
      setReceiptId(null);
    }
  };

  const payWithGPay = async (trip: Trip) => {
    const amount = paymentFor(trip).amount.toFixed(2);
    const url = `tez://upi/pay?am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(
      trip.bus_name ?? t("busesTitle")
    )}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(t("paymentOptions"), t("paymentFailed"));
        return;
      }
      await Linking.openURL(url);
      Alert.alert(t("paymentOptions"), t("confirmGPay"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("paidViaGPay"), onPress: () => updatePayment(trip, "gpay") },
      ]);
    } catch {
      Alert.alert(t("somethingWentWrong"), t("paymentFailed"));
    }
  };

  const openTracking = (trip: Trip) => {
    if (
      trip.status !== "traveling" ||
      trip.from_lat == null ||
      trip.from_lng == null ||
      trip.dest_lat == null ||
      trip.dest_lng == null
    ) {
      return;
    }
    router.push({
      pathname: "/Passenger/TrackingScreen",
      params: {
        fromLat: trip.from_lat ?? "",
        fromLng: trip.from_lng ?? "",
        destLat: trip.dest_lat ?? "",
        destLng: trip.dest_lng ?? "",
        stopName: trip.bus_stop_name ?? "",
        busName: trip.bus_name ?? "",
      },
    });
  };

  const sections = [
    { title: t("currentTrips"), data: trips.filter((trip) => trip.status !== "completed") },
    { title: t("completedTrips"), data: trips.filter((trip) => trip.status === "completed") },
  ];

  return (
    <Screen padded={false} edges={["top"]}>
      <AppBar title={t("tripsTitle")} />

      {loading ? (
        <View>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          SectionSeparatorComponent={() => <Divider inset={theme.spacing.xl} />}
          renderSectionHeader={({ section }) => (
            <Text
              variant="footnote"
              weight="semibold"
              style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg }}
            >
              {section.title}
            </Text>
          )}
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
          renderItem={({ item }) => {
            const payment = paymentFor(item);
            const completed = item.status === "completed";
            const canTrack =
              item.status === "traveling" &&
              item.from_lat != null &&
              item.from_lng != null &&
              item.dest_lat != null &&
              item.dest_lng != null;
            return (
              <View>
                <ListRow
                  icon="bus"
                  title={item.bus_name ?? t("busesTitle")}
                  subtitle={
                    completed
                      ? item.bus_stop_name
                        ? t("boardingAt", { stop: item.bus_stop_name })
                        : t("statusCompleted")
                      : [
                          item.bus_stop_name ? t("boardingAt", { stop: item.bus_stop_name }) : null,
                          item.timing ? formatTime(item.timing) : null,
                          t("fare", { amount: payment.amount.toFixed(2) }),
                        ]
                          .filter(Boolean)
                          .join(" · ")
                  }
                  onPress={canTrack ? () => openTracking(item) : undefined}
                  hint={canTrack ? t("viewTracking") : undefined}
                  accessibilityLabel={[
                    item.bus_name ?? t("busesTitle"),
                    item.bus_stop_name ? t("boardingAt", { stop: item.bus_stop_name }) : "",
                    statusLabel(item.status),
                    payment.method === "gpay" ? t("paidViaGPay") : t("paidInCash"),
                  ]
                    .filter(Boolean)
                    .join(". ")}
                  showChevron={canTrack}
                  trailing={
                    <Badge
                      label={statusLabel(item.status)}
                      tone={statusTone[item.status]}
                      icon={statusIcon[item.status]}
                    />
                  }
                />
                {item.status === "traveling" ? (
                  <View
                    style={{
                      paddingHorizontal: theme.spacing.xl,
                      paddingBottom: theme.spacing.md,
                      gap: theme.spacing.sm,
                    }}
                  >
                    <Badge
                      label={
                        payment.status !== "paid"
                          ? t("notPaid")
                          : payment.method === "gpay"
                            ? t("paidViaGPay")
                            : t("paidInCash")
                      }
                      tone="success"
                      icon="checkmark-circle"
                    />
                    <Button
                      label={t("payWithGPay")}
                      icon="card-outline"
                      size="sm"
                      loading={payingId === item.id}
                      onPress={() => payWithGPay(item)}
                    />
                    <Button
                      label={t("paidInCash")}
                      icon="cash-outline"
                      variant="outline"
                      size="sm"
                      loading={payingId === item.id}
                      onPress={() => updatePayment(item, "cash")}
                    />
                    {payment.status === "paid" ? (
                      <Button
                        label={t("downloadReceipt")}
                        icon="download-outline"
                        variant="ghost"
                        size="sm"
                        loading={receiptId === item.id}
                        onPress={() => downloadReceipt(item)}
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
