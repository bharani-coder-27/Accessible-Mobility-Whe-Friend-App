import React from 'react';
import { ActivityIndicator, Pressable, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Spoken by a screen reader after the label, to explain what happens next. */
  hint?: string;
  style?: ViewStyle;
}

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  hint,
  style,
}: ButtonProps) => {
  const theme = useTheme();
  const haptic = useHaptics();
  const isInactive = disabled || loading;

  const height = { sm: 40, md: theme.touchTarget, lg: 56 }[size];
  const textVariant = size === 'sm' ? ('footnote' as const) : ('bodyLg' as const);

  const surfaces: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.colors.primary, fg: theme.colors.onPrimary, border: 'transparent' },
    secondary: {
      bg: theme.colors.primarySoft,
      fg: theme.colors.primaryText,
      border: 'transparent',
    },
    outline: { bg: 'transparent', fg: theme.colors.primaryText, border: theme.colors.borderStrong },
    ghost: { bg: 'transparent', fg: theme.colors.primaryText, border: 'transparent' },
    danger: { bg: theme.colors.danger, fg: theme.colors.onDanger, border: 'transparent' },
  };

  const surface = surfaces[variant];
  const showsBorder = variant === 'outline' || (theme.highContrast && variant !== 'ghost');

  const handlePress = () => {
    haptic(variant === 'danger' ? 'warning' : 'light');
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={handlePress}
      style={({ pressed }) => [
        {
          minHeight: height,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          paddingHorizontal: size === 'sm' ? theme.spacing.md : theme.spacing.xl,
          borderRadius: theme.radius.md,
          backgroundColor: surface.bg,
          borderWidth: showsBorder ? (theme.highContrast ? 2 : 1) : 0,
          borderColor: surface.border === 'transparent' ? theme.colors.borderStrong : surface.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          // Opacity alone would drop the label below AA, so inactive buttons
          // stay legible and rely on accessibilityState to convey the state.
          opacity: isInactive ? 0.55 : pressed ? 0.85 : 1,
        },
        variant === 'primary' || variant === 'danger' ? theme.shadow(1) : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={surface.fg} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={theme.size('bodyLg') + 3} color={surface.fg} />
          )}
          <Text variant={textVariant} weight="semibold" style={{ color: surface.fg }}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={theme.size('bodyLg') + 3} color={surface.fg} />
          )}
        </>
      )}
    </Pressable>
  );
};

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Required: an icon with no label is invisible to a screen reader. */
  label: string;
  hint?: string;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}

/** A square, icon-only control that still meets the minimum touch target. */
export const IconButton = ({
  icon,
  onPress,
  label,
  hint,
  tone = 'default',
  disabled,
  style,
}: IconButtonProps) => {
  const theme = useTheme();
  const haptic = useHaptics();

  const color = {
    default: theme.colors.text,
    primary: theme.colors.primaryText,
    danger: theme.colors.danger,
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      style={({ pressed }) => [
        {
          width: theme.touchTarget,
          height: theme.touchTarget,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius.md,
          backgroundColor: pressed ? theme.colors.surfacePressed : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View>
        <Ionicons name={icon} size={theme.size('titleLg')} color={color} />
      </View>
    </Pressable>
  );
};
