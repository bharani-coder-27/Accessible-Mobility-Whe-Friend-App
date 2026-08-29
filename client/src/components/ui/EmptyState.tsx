import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'danger';
}

/**
 * The placeholder for an empty or failed list.
 *
 * Always says what happened and what to do next — an empty screen with no
 * explanation is one of the most common ways an app strands a user.
 */
export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'neutral',
}: EmptyStateProps) => {
  const theme = useTheme();
  const accent = tone === 'danger' ? theme.colors.danger : theme.colors.primaryText;
  const accentSoft = tone === 'danger' ? theme.colors.dangerSoft : theme.colors.primarySoft;

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={[title, description].filter(Boolean).join('. ')}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xxl,
        paddingVertical: theme.spacing.huge,
        gap: theme.spacing.md,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accentSoft,
        }}
      >
        <Ionicons name={icon} size={34} color={accent} />
      </View>

      <Text variant="title" weight="semibold" center>
        {title}
      </Text>

      {description ? (
        <Text variant="body" tone="muted" center>
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          fullWidth={false}
          style={{ marginTop: theme.spacing.sm }}
        />
      ) : null}
    </View>
  );
};
