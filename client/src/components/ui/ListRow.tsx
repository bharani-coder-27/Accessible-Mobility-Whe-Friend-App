import React, { ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: 'primary' | 'muted' | 'success' | 'danger';
  /** Rendered on the right — a badge, a time, a chevron replacement. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Overrides the spoken name. Use when the visual title is not self-explanatory. */
  accessibilityLabel?: string;
  hint?: string;
  showChevron?: boolean;
  destructive?: boolean;
  style?: ViewStyle;
}

/**
 * A tappable row.
 *
 * The whole row is one accessibility node — a screen reader reads the title,
 * subtitle and trailing content as a single item rather than three
 * disconnected fragments the user has to stitch together.
 */
export const ListRow = ({
  title,
  subtitle,
  icon,
  iconTone = 'primary',
  trailing,
  onPress,
  accessibilityLabel,
  hint,
  showChevron = false,
  destructive = false,
  style,
}: ListRowProps) => {
  const theme = useTheme();
  const haptic = useHaptics();

  const iconColor = {
    primary: theme.colors.primaryText,
    muted: theme.colors.textMuted,
    success: theme.colors.success,
    danger: theme.colors.danger,
  }[destructive ? 'danger' : iconTone];

  const content = (
    <>
      {icon && (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: destructive ? theme.colors.dangerSoft : theme.colors.primarySoft,
          }}
        >
          <Ionicons name={icon} size={theme.size('title')} color={iconColor} />
        </View>
      )}

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyLg" weight="medium" tone={destructive ? 'danger' : 'default'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing}
      {showChevron && (
        <Ionicons name="chevron-forward" size={theme.size('title')} color={theme.colors.textMuted} />
      )}
    </>
  );

  const layout: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: theme.touchTarget,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  };

  if (!onPress) {
    return <View style={[layout, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join('. ')}
      accessibilityHint={hint}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      style={({ pressed }) => [
        layout,
        { backgroundColor: pressed ? theme.colors.surfacePressed : 'transparent' },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
};
