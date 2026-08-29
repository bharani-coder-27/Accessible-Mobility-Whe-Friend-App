import React from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './ui/Text';
import { images } from '../../constants/images';

export interface BrandMarkProps {
  size?: number;
  showName?: boolean;
  name?: string;
}

/** The app logo in a rounded tile, optionally with the app name beside it. */
export const BrandMark = ({ size = 56, showName = false, name }: BrandMarkProps) => {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primarySoft,
          borderWidth: theme.highContrast ? 2 : 0,
          borderColor: theme.colors.primaryText,
        }}
      >
        <Image
          source={images.logoMark}
          style={{ width: size * 0.62, height: size * 0.62 }}
          resizeMode="contain"
          // The app name is rendered as real text beside or below this, so the
          // logo itself carries no information a screen reader needs.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>

      {showName && name ? (
        <Text variant="titleLg" weight="bold">
          {name}
        </Text>
      ) : null}
    </View>
  );
};
