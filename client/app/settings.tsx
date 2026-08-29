import React from "react";
import { View } from "react-native";
import Constants from "expo-constants";

import { useLanguage } from "../src/contexts/LanguageContext";
import { useTheme, useThemePreferences, ThemeMode, TextSize } from "../src/theme";
import { Language, languageNames, supportedLanguages } from "../src/i18n";
import {
  AppBar,
  Card,
  Screen,
  SegmentedControl,
  SwitchRow,
  Text,
} from "../src/components/ui";

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

  return (
    <Screen scroll padded={false} contentStyle={{ paddingBottom: theme.spacing.xxxl }}>
      <AppBar title={t("settings")} showBack />

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
