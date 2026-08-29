import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { IconButton } from './Button';
import { Text } from './Text';

export interface AppBarProps {
  title: string;
  subtitle?: string;
  /** Shows a back control. Defaults to router.back(). */
  onBack?: () => void;
  showBack?: boolean;
  /** Leading control shown when there is no back button, e.g. a menu toggle. */
  leading?: ReactNode;
  actions?: ReactNode;
  /** Adds a bottom rule. Off when the screen below provides its own boundary. */
  bordered?: boolean;
}

export const AppBar = ({
  title,
  subtitle,
  onBack,
  showBack = false,
  leading,
  actions,
  bordered = true,
}: AppBarProps) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View
      // Grouping the bar as a header lets screen reader users jump straight to
      // it, and announces the screen name on arrival.
      accessibilityRole="header"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        minHeight: theme.touchTarget + theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.bg,
        borderBottomWidth: bordered ? (theme.highContrast ? 2 : 1) : 0,
        borderBottomColor: theme.colors.border,
      }}
    >
      {showBack ? (
        <IconButton
          icon="arrow-back"
          label="Go back"
          onPress={onBack ?? (() => router.back())}
        />
      ) : (
        leading
      )}

      <View style={{ flex: 1, marginLeft: showBack || leading ? 0 : theme.spacing.xs }}>
        <Text variant="title" weight="bold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actions}
    </View>
  );
};
