import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ElevationLevel } from '../../theme/tokens';

export interface CardProps {
  children: ReactNode;
  /** `alt` uses the recessed surface, for cards sitting on top of a card. */
  variant?: 'default' | 'alt' | 'outlined';
  level?: ElevationLevel;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const Card = ({
  children,
  variant = 'default',
  level = 1,
  padded = true,
  style,
}: CardProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: variant === 'alt' ? theme.colors.surfaceAlt : theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: padded ? theme.spacing.lg : 0,
          // Under high contrast every card gets a hard border, because the
          // shadow it would otherwise rely on is switched off.
          borderWidth: variant === 'outlined' || theme.highContrast ? (theme.highContrast ? 2 : 1) : 0,
          borderColor: theme.colors.border,
        },
        theme.shadow(variant === 'outlined' ? 0 : level),
        style,
      ]}
    >
      {children}
    </View>
  );
};
