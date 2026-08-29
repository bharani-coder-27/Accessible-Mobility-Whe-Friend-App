import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * A shimmering placeholder block.
 *
 * The pulse stops entirely when the user has reduce-motion enabled; a
 * continuously animating screen is actively unpleasant for some vestibular
 * conditions, and the static block still reads as "loading".
 */
export const Skeleton = ({ width = '100%', height = 16, radius, style }: SkeletonProps) => {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (theme.reduceMotion) {
      pulse.setValue(0.75);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [pulse, theme.reduceMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.surfaceAlt,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
};

/** A skeleton shaped like a ListRow, for list-loading states. */
export const SkeletonRow = () => {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <Skeleton width={40} height={40} radius={theme.radius.md} />
      <View style={{ flex: 1, gap: theme.spacing.sm }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
};
