import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface StepIndicatorProps {
  steps: string[];
  /** Zero-based index of the step the user is on. */
  current: number;
}

/**
 * Progress through the booking flow.
 *
 * Multi-step flows are where users most often lose their bearings — showing
 * "Step 2 of 4: Choose a stop" tells them where they are, how much is left,
 * and that going back is safe. The whole strip is one spoken sentence.
 */
export const StepIndicator = ({ steps, current }: StepIndicatorProps) => {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}
      accessibilityValue={{ min: 1, max: steps.length, now: current + 1 }}
      style={{ gap: theme.spacing.sm }}
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        {steps.map((step, index) => (
          <View
            key={step}
            style={{
              flex: 1,
              height: 6,
              borderRadius: theme.radius.pill,
              backgroundColor: index <= current ? theme.colors.primary : theme.colors.surfaceAlt,
              borderWidth: theme.highContrast ? 1 : 0,
              borderColor: theme.colors.border,
            }}
          />
        ))}
      </View>

      <Text variant="caption" tone="muted" weight="medium">
        {`Step ${current + 1} of ${steps.length} · ${steps[current]}`}
      </Text>
    </View>
  );
};
