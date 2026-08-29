import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers, e.g. "Account type". */
  label: string;
  style?: ViewStyle;
}

/**
 * A grouped set of mutually exclusive choices.
 *
 * Each segment is a radio, not a button, so a screen reader announces both the
 * choice and whether it is selected.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const haptic = useHaptics();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[
        {
          flexDirection: 'row',
          gap: theme.spacing.xs,
          padding: theme.spacing.xs,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAlt,
          borderWidth: theme.highContrast ? 2 : 0,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => {
              haptic('select');
              onChange(option.value);
            }}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.xs,
              minHeight: theme.touchTarget - 8,
              paddingHorizontal: theme.spacing.sm,
              borderRadius: theme.radius.sm,
              backgroundColor: selected
                ? theme.colors.primary
                : pressed
                  ? theme.colors.surfacePressed
                  : 'transparent',
            })}
          >
            {option.icon && (
              <Ionicons
                name={option.icon}
                size={theme.size('body') + 3}
                color={selected ? theme.colors.onPrimary : theme.colors.textMuted}
              />
            )}
            <Text
              variant="footnote"
              weight="semibold"
              numberOfLines={1}
              style={{ color: selected ? theme.colors.onPrimary : theme.colors.textMuted }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
