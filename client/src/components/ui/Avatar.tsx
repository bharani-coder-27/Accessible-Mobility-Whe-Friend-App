import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

/** Derive up to two initials from a display name. */
const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export interface AvatarProps {
  name: string;
  size?: number;
  tone?: 'primary' | 'neutral';
}

/**
 * An initials avatar.
 *
 * Deliberately not a photo: a generated monogram is always legible, never
 * fails to load, and avoids shipping a stock headshot that misrepresents the
 * person using the account.
 */
export const Avatar = ({ name, size = 44, tone = 'primary' }: AvatarProps) => {
  const theme = useTheme();
  const bg = tone === 'primary' ? theme.colors.primarySoft : theme.colors.surfaceAlt;
  const fg = tone === 'primary' ? theme.colors.primaryText : theme.colors.textMuted;

  return (
    <View
      // The name is always rendered next to the avatar, so the monogram itself
      // is redundant for a screen reader.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderWidth: theme.highContrast ? 2 : 0,
        borderColor: fg,
      }}
    >
      <Text weight="bold" style={{ color: fg, fontSize: size * 0.38, lineHeight: size * 0.46 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
};
