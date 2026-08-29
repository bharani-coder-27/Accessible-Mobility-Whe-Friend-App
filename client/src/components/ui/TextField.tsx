import React, { useState } from 'react';
import {
  Pressable,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  /** Persistent helper text shown under the field. */
  hint?: string;
  /** Validation message. Presence of this also puts the field in an error state. */
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  required?: boolean;
  /** Renders a show/hide toggle and starts the field masked. */
  secure?: boolean;
  /** Makes the field a button instead of an input — for date pickers etc. */
  onPress?: () => void;
  containerStyle?: ViewStyle;
}

export const TextField = ({
  label,
  hint,
  error,
  icon,
  required,
  secure,
  onPress,
  containerStyle,
  editable = true,
  ...rest
}: TextFieldProps) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [masked, setMasked] = useState(!!secure);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.focus
      : theme.colors.border;

  const field = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        minHeight: theme.touchTarget,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: editable ? theme.colors.surface : theme.colors.surfaceAlt,
        borderWidth: focused || error || theme.highContrast ? 2 : 1,
        borderColor,
      }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={theme.size('bodyLg') + 3}
          color={error ? theme.colors.danger : theme.colors.textMuted}
        />
      )}
      <TextInput
        editable={editable && !onPress}
        pointerEvents={onPress ? 'none' : 'auto'}
        secureTextEntry={masked}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        // The visible label is the accessible name; screen readers should not
        // also read the placeholder, which is usually a duplicate or an example.
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          paddingVertical: theme.spacing.md,
          color: theme.colors.text,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.size('bodyLg'),
        }}
        {...rest}
      />
      {secure && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={masked ? `Show ${label}` : `Hide ${label}`}
          onPress={() => setMasked((value) => !value)}
          hitSlop={12}
          style={{ padding: theme.spacing.xs }}
        >
          <Ionicons
            name={masked ? 'eye-outline' : 'eye-off-outline'}
            size={theme.size('bodyLg') + 3}
            color={theme.colors.textMuted}
          />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[{ gap: theme.spacing.xs }, containerStyle]}>
      <Text variant="footnote" weight="medium" tone="muted">
        {label}
        {required ? ' *' : ''}
      </Text>

      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{ text: (rest.value as string) || 'Not set' }}
          onPress={onPress}
        >
          {field}
        </Pressable>
      ) : (
        field
      )}

      {/* Errors are a live region so a screen reader announces them the moment
          validation fails, rather than only when the field is re-focused. */}
      {error ? (
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}
        >
          <Ionicons name="alert-circle" size={theme.size('footnote') + 2} color={theme.colors.danger} />
          <Text variant="footnote" tone="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="footnote" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
};
