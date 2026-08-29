import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { fontSize } from '../../theme/tokens';

export type TextVariant =
  | 'displayLg'
  | 'display'
  | 'titleLg'
  | 'title'
  | 'bodyLg'
  | 'body'
  | 'footnote'
  | 'caption';

export type TextTone = 'default' | 'muted' | 'primary' | 'inverse' | 'danger' | 'success' | 'warning';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: TextWeight;
  center?: boolean;
}

const variantToSize: Record<TextVariant, keyof typeof fontSize> = {
  displayLg: 'displayLg',
  display: 'display',
  titleLg: 'titleLg',
  title: 'title',
  bodyLg: 'bodyLg',
  body: 'body',
  footnote: 'footnote',
  caption: 'caption',
};

const defaultWeight: Record<TextVariant, TextWeight> = {
  displayLg: 'bold',
  display: 'bold',
  titleLg: 'semibold',
  title: 'semibold',
  bodyLg: 'regular',
  body: 'regular',
  footnote: 'regular',
  caption: 'medium',
};

/**
 * The app's only text primitive.
 *
 * Routing every string through here means the user's text-size preference,
 * the active palette and the Inter font stack are applied consistently, and
 * that no screen can accidentally ship an unreadable colour pairing.
 */
export const Text = ({
  variant = 'body',
  tone = 'default',
  weight,
  center,
  style,
  ...rest
}: TextProps) => {
  const theme = useTheme();
  const sizeKey = variantToSize[variant];

  const toneColor: Record<TextTone, string> = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    primary: theme.colors.primaryText,
    inverse: theme.colors.textInverse,
    danger: theme.colors.danger,
    success: theme.colors.success,
    warning: theme.colors.warning,
  };

  const resolved: TextStyle = {
    fontFamily: theme.fontFamily[weight ?? defaultWeight[variant]],
    fontSize: theme.size(sizeKey),
    lineHeight: theme.leading(sizeKey),
    color: toneColor[tone],
    ...(center ? { textAlign: 'center' as const } : null),
  };

  return <RNText style={[resolved, style]} {...rest} />;
};
