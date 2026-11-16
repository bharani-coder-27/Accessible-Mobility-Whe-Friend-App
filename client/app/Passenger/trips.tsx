import React, { useCallback, useState } from "react";
import { Alert, FlatList, Linking, RefreshControl, View } from "react-native";
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
              trip.payment.method === "gpay" ? t("paidViaGPay") : t("paidInCash")
            )}</p>
            <h3>Fare: ₹${trip.payment.amount.toFixed(2)}</h3>
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
    const amount = trip.payment.amount.toFixed(2);
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
    if (trip.status !== "traveling") return;
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
            <View>
              <ListRow
                icon="bus"
                title={item.bus_name ?? t("busesTitle")}
                subtitle={[
                  item.bus_stop_name ? t("boardingAt", { stop: item.bus_stop_name }) : null,
                  item.timing ? formatTime(item.timing) : null,
                  t("fare", { amount: item.payment.amount.toFixed(2) }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
                onPress={item.status === "traveling" ? () => openTracking(item) : undefined}
                hint={item.status === "traveling" ? t("viewTracking") : undefined}
                accessibilityLabel={[
                  item.bus_name ?? t("busesTitle"),
                  item.bus_stop_name ? t("boardingAt", { stop: item.bus_stop_name }) : "",
                  statusLabel(item.status),
                  item.payment.method === "gpay" ? t("paidViaGPay") : t("paidInCash"),
                ]
                  .filter(Boolean)
                  .join(". ")}
                showChevron={item.status === "traveling"}
                trailing={
                  <Badge
                    label={statusLabel(item.status)}
                    tone={statusTone[item.status]}
                    icon={statusIcon[item.status]}
                  />
                }
              />
              {item.status === "traveling" ? (
                <View style={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.md, gap: theme.spacing.sm }}>
                  <Badge
                    label={item.payment.method === "gpay" ? t("paidViaGPay") : t("paidInCash")}
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
                  {item.payment.status === "paid" ? (
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
          )}
        />
      )}
    </Screen>
  );
}
