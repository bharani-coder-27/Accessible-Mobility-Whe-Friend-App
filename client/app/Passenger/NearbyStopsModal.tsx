import React, { useState } from "react";
import { FlatList, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { BusStop } from "../../src/types";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useTheme } from "../../src/theme";
import api, { errorMessage } from "../../src/services/api";
import {
  AppBar,
  Divider,
  EmptyState,
  ListRow,
  Screen,
  SkeletonRow,
  StepIndicator,
  Text,
} from "../../src/components/ui";

/** Parse a JSON route param without letting a malformed value crash the screen. */
const parseParam = <T,>(value: string | string[] | undefined, fallback: T): T => {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export default function NearbyStopsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const theme = useTheme();

  const stops = parseParam<BusStop[]>(params.stops, []);
  const fromAddress = (params.fromAddress as string) || "";

  const [loadingStopId, setLoadingStopId] = useState<number | null>(null);

  const openTimings = async (stop: BusStop) => {
    setLoadingStopId(stop.id);
    try {
      const { data } = await api.get("/buses/bus_timings", {
        params: { stop_id: stop.id, current_time: new Date().toISOString() },
      });

      router.push({
        pathname: "/Passenger/BusTimingsList",
        params: {
          timings: JSON.stringify(data ?? []),
          selectedStop: JSON.stringify(stop),
          fromCoords: params.fromCoords as string,
          toCoords: params.toCoords as string,
        },
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("somethingWentWrong"),
        text2: errorMessage(error, t("checkConnection")),
      });
    } finally {
      setLoadingStopId(null);
    }
  };

  return (
    <Screen padded={false}>
      <AppBar title={t("stopsTitle")} showBack />

      <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <StepIndicator
          steps={[t("stepPlan"), t("stepStop"), t("stepBus"), t("stepTrack")]}
          current={1}
        />

        <Text variant="title" weight="semibold">
          {t("stopsNear", { place: fromAddress || t("currentLocation") })}
        </Text>
      </View>

      <FlatList
        data={stops}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <Divider inset={theme.spacing.xl} />}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        ListEmptyComponent={
          <EmptyState icon="map-outline" title={t("noStops")} description={t("noStopsDesc")} />
        }
        renderItem={({ item }) =>
          loadingStopId === item.id ? (
            <SkeletonRow />
          ) : (
            <ListRow
              icon="location"
              title={item.stop_name}
              subtitle={
                typeof item.distance === "number"
                  ? t("kmAway", { distance: item.distance.toFixed(1) })
                  : undefined
              }
              onPress={() => openTimings(item)}
              hint={t("selectStopHint")}
              showChevron
            />
          )
        }
      />
    </Screen>
  );
}
