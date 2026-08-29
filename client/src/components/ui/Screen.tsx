import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

export interface ScreenProps {
  children: ReactNode;
  /** Wraps content in a ScrollView. Off for screens that own a FlatList or map. */
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  /** Rendered outside the scroll area, pinned to the bottom. */
  footer?: ReactNode;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
}

/**
 * The page shell every screen sits in.
 *
 * Centralising safe-area insets, the status-bar style and keyboard avoidance
 * here is what stops the "content hidden under the notch / behind the
 * keyboard" class of bug from reappearing screen by screen.
 */
export const Screen = ({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  footer,
  contentStyle,
  style,
}: ScreenProps) => {
  const theme = useTheme();

  const padding: ViewStyle = padded
    ? { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }
    : {};

  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: theme.colors.bg }, style]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.bg}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[padding, { flexGrow: 1 }, contentStyle]}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, padding, contentStyle]}>{children}</View>
        )}

        {footer ? (
          <View
            style={{
              paddingHorizontal: theme.spacing.xl,
              paddingTop: theme.spacing.md,
              paddingBottom: theme.spacing.lg,
              backgroundColor: theme.colors.bg,
              borderTopWidth: theme.highContrast ? 2 : 1,
              borderTopColor: theme.colors.border,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
