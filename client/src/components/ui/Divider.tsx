import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

/** A hairline rule. Decorative, so it is hidden from screen readers. */
export const Divider = ({ style, inset = 0 }: { style?: ViewStyle; inset?: number }) => {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height: theme.highContrast ? 2 : 1,
          backgroundColor: theme.colors.border,
          marginLeft: inset,
        },
        style,
      ]}
    />
  );
};
