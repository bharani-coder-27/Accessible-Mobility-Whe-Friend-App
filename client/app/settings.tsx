import React, { useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import Constants from "expo-constants";

import { useLanguage } from "../src/contexts/LanguageContext";
import { useTheme, useThemePreferences, ThemeMode, TextSize } from "../src/theme";
import { Language, languageNames, supportedLanguages } from "../src/i18n";
import {
  AppBar,
  Button,
  Card,
  Screen,
  SegmentedControl,
  SwitchRow,
  Text,
  TextField,
} from "../src/components/ui";
import {
  defaultServerBase,
  getServerBase,
  isUsingDefaultServer,
  isValidServerBase,
  resetServerBase,
  setServerBase,
} from "../src/services/serverConfig";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="footnote" weight="semibold" tone="muted">
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
};

/**
 * Accessibility and appearance preferences.
 *
 * These live in the app rather than relying on the OS settings alone: a rider
 * who cannot navigate system settings, or who shares the device, still needs
 * to be able to make this app readable.
 */
export default function SettingsScreen() {
  const { t } = useLanguage();
  const { language, setLanguage } = useLanguage();
  const theme = useTheme();
  const { mode, setMode, highContrast, setHighContrast, textSize, setTextSize } =
    useThemePreferences();

  const [serverUrl, setServerUrl] = useState(getServerBase());
  const [serverError, setServerError] = useState<string | undefined>();
  const [usingDefault, setUsingDefault] = useState(isUsingDefaultServer());

  const saveServer = async () => {
    if (!isValidServerBase(serverUrl)) {
      setServerError(t("serverUrlInvalid"));
      return;
    }

    await setServerBase(serverUrl);
    setServerUrl(getServerBase());
    setUsingDefault(isUsingDefaultServer());
    setServerError(undefined);
    Toast.show({ type: "success", text1: t("serverUrlSaved") });
  };

  const restoreServer = async () => {
    await resetServerBase();
    setServerUrl(getServerBase());
    setUsingDefault(true);
    setServerError(undefined);
  };

  return (
    <Screen
      scroll
      padded={false}
      header={<AppBar title={t("settings")} showBack />}
      contentStyle={{ paddingBottom: theme.spacing.xxxl }}
    >
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.xxl }}>
        <Section title={t("language")}>
          <Card>
            <SegmentedControl
              label={t("language")}
              value={language}
              onChange={(value) => setLanguage(value as Language)}
              options={supportedLanguages.map((code) => ({
                value: code,
                label: languageNames[code],
              }))}
            />
          </Card>
        </Section>

        {/* The build-time address is only a default. A tunnelled dev server
            changes address whenever the tunnel restarts, so without this every
            change would mean rebuilding and redistributing the app. */}
        <Section title={t("server")}>
          <Card style={{ gap: theme.spacing.md }}>
            <TextField
              label={t("serverUrl")}
              icon="cloud-outline"
              hint={usingDefault ? t("serverUrlDefault") : undefined}
              error={serverError}
              value={serverUrl}
              onChangeText={(value) => {
                setServerUrl(value);
                setServerError(undefined);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder={defaultServerBase}
            />
            <Text variant="footnote" tone="muted">
              {t("serverUrlHint")}
            </Text>
            <Button label={t("save")} onPress={saveServer} icon="checkmark-outline" />
            {!usingDefault ? (
              <Button label={t("resetToDefault")} onPress={restoreServer} variant="ghost" />
            ) : null}
          </Card>
        </Section>

        <Section title={t("appearance")}>
          <Card style={{ gap: theme.spacing.lg }}>
            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="footnote" weight="medium" tone="muted">
                {t("theme")}
              </Text>
              <SegmentedControl
                label={t("theme")}
                value={mode}
                onChange={(value) => setMode(value as ThemeMode)}
                options={[
                  { value: "system", label: t("themeSystem"), icon: "phone-portrait-outline" },
                  { value: "light", label: t("themeLight"), icon: "sunny-outline" },
                  { value: "dark", label: t("themeDark"), icon: "moon-outline" },
                ]}
              />
            </View>
          </Card>
        </Section>

        <Section title={t("accessibility")}>
          <Card style={{ gap: theme.spacing.lg }} padded>
            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="footnote" weight="medium" tone="muted">
                {t("textSize")}
              </Text>
              <SegmentedControl
                label={t("textSize")}
                value={textSize}
                onChange={(value) => setTextSize(value as TextSize)}
                options={[
                  { value: "default", label: t("textDefault") },
                  { value: "large", label: t("textLarge") },
                  { value: "xlarge", label: t("textXLarge") },
                ]}
              />
              {/* A live sample, so the effect of the choice is visible without
                  navigating away to find some other text to judge it by. */}
              <Text variant="bodyLg">{t("planSubtitle")}</Text>
            </View>
          </Card>

          <Card padded={false}>
            <SwitchRow
              label={t("highContrast")}
              description={t("highContrastDesc")}
              value={highContrast}
              onValueChange={setHighContrast}
            />
          </Card>
        </Section>

        <Section title={t("about")}>
          <Card style={{ gap: theme.spacing.xs }}>
            <Text variant="bodyLg" weight="semibold">
              {t("appName")}
            </Text>
            <Text variant="footnote" tone="muted">
              {`${t("version")} ${Constants.expoConfig?.version ?? "1.0.0"}`}
            </Text>
          </Card>
        </Section>
      </View>
    </Screen>
  );
}
