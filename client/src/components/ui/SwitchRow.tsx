import React from 'react';
import { Switch, View } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Text } from './Text';

export interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/**
 * A labelled on/off setting.
 *
 * The row is a single switch node so a screen reader reads the label and the
 * state together and can toggle it directly, instead of exposing a separate
 * unlabelled control.
 */
export const SwitchRow = ({ label, description, value, onValueChange }: SwitchRowProps) => {
  const theme = useTheme();
  const haptic = useHaptics();

  return (
    <View
      accessible
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.lg,
        minHeight: theme.touchTarget,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyLg" weight="medium">
          {label}
        </Text>
        {description ? (
          <Text variant="footnote" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>

      <Switch
        value={value}
        onValueChange={(next) => {
          haptic('select');
          onValueChange(next);
        }}
        trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
      />
    </View>
  );
};
