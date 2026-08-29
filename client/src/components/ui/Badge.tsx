import React from 'react';
import { View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { Text } from './Text';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

/**
 * A small status pill.
 *
 * Every tone carries a label, and callers are encouraged to pass an icon too,
 * so status is never communicated by colour alone (WCAG 1.4.1).
 */
export const Badge = ({ label, tone = 'neutral', icon, style }: BadgeProps) => {
  const theme = useTheme();

  const tones: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: theme.colors.surfaceAlt, fg: theme.colors.textMuted },
    primary: { bg: theme.colors.primarySoft, fg: theme.colors.primaryText },
    success: { bg: theme.colors.successSoft, fg: theme.colors.success },
    warning: { bg: theme.colors.warningSoft, fg: theme.colors.warning },
    danger: { bg: theme.colors.dangerSoft, fg: theme.colors.danger },
    info: { bg: theme.colors.infoSoft, fg: theme.colors.info },
  };

  const { bg, fg } = tones[tone];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          alignSelf: 'flex-start',
          paddingHorizontal: theme.spacing.sm + 2,
          paddingVertical: theme.spacing.xs + 1,
          borderRadius: theme.radius.pill,
          backgroundColor: bg,
          borderWidth: theme.highContrast ? 1 : 0,
          borderColor: fg,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={theme.size('caption') + 2} color={fg} />}
      <Text variant="caption" weight="semibold" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
};
