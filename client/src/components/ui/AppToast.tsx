import React from "react";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { useTheme } from "../../theme";
import { Text } from "./Text";

type Tone = "success" | "error" | "info";

const ToastCard = ({ tone, text1, text2 }: { tone: Tone } & ToastConfigParams<unknown>) => {
  const theme = useTheme();

  const config = {
    success: { icon: "checkmark-circle" as const, color: theme.colors.success },
    error: { icon: "alert-circle" as const, color: theme.colors.danger },
    info: { icon: "information-circle" as const, color: theme.colors.info },
  }[tone];

  return (
    <View
      // Announced politely so a toast never interrupts what the screen reader
      // is already speaking, but is still read out.
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={[text1, text2].filter(Boolean).join(". ")}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          width: "92%",
          minHeight: theme.touchTarget,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          borderWidth: theme.highContrast ? 2 : 1,
          borderColor: theme.colors.border,
          // A coloured leading edge, in addition to the icon, so the tone is
          // not carried by the icon's colour alone.
          borderLeftWidth: 5,
          borderLeftColor: config.color,
        },
        theme.shadow(2),
      ]}
    >
      <Ionicons name={config.icon} size={theme.size("titleLg")} color={config.color} />

      <View style={{ flex: 1, gap: 2 }}>
        {text1 ? (
          <Text variant="body" weight="semibold" numberOfLines={2}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text variant="footnote" tone="muted" numberOfLines={3}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

/**
 * Toast styling that follows the active theme.
 *
 * The library's defaults are a fixed light card, which is unreadable in dark
 * mode and ignores the high-contrast setting entirely.
 */
export const toastConfig: ToastConfig = {
  success: (props) => <ToastCard tone="success" {...props} />,
  error: (props) => <ToastCard tone="error" {...props} />,
  info: (props) => <ToastCard tone="info" {...props} />,
};
