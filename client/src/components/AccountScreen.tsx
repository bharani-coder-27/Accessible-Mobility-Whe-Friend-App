import React, { useContext } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";

import { AuthContext } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../theme";
import { AppBar, Avatar, Badge, Card, Divider, ListRow, Screen, Text } from "./ui";

/**
 * The account hub, shared by both roles.
 *
 * Passengers and conductors need the same things here — who am I, edit my
 * details, change my settings, sign out — so the body lives in one place and
 * each role's tab renders it, rather than the two drifting apart.
 */
export const AccountScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useLanguage();
  const theme = useTheme();
  const router = useRouter();

  const confirmSignOut = () => {
    Alert.alert(t("signOutConfirm"), t("signOutMessage"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("signOut"), style: "destructive", onPress: () => logout() },
    ]);
  };

  const name = user?.name ?? "";

  return (
    <Screen
      scroll
      padded={false}
      edges={["top"]}
      header={<AppBar title={t("account")} />}
      contentStyle={{ paddingBottom: theme.spacing.xxxl }}
    >
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.xl }}>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.lg }}>
          <Avatar name={name} size={56} />

          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="title" weight="bold" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="footnote" tone="muted" numberOfLines={1}>
              {user?.email}
            </Text>
            <Badge
              label={user?.role === "conductor" ? t("conductor") : t("passenger")}
              tone="primary"
              icon={user?.role === "conductor" ? "bus" : "person"}
            />
          </View>
        </Card>

        <Card padded={false}>
          <ListRow
            icon="person-circle-outline"
            title={t("editProfile")}
            subtitle={t("personalDetails")}
            onPress={() => router.push("/profile")}
            showChevron
          />
          <Divider inset={theme.spacing.lg} />
          <ListRow
            icon="settings-outline"
            title={t("settings")}
            subtitle={`${t("appearance")} · ${t("language")} · ${t("accessibility")}`}
            onPress={() => router.push("/settings")}
            showChevron
          />
        </Card>

        <Card padded={false}>
          <ListRow
            icon="log-out-outline"
            title={t("signOut")}
            destructive
            onPress={confirmSignOut}
            hint={t("signOutMessage")}
          />
        </Card>
      </View>
    </Screen>
  );
};
