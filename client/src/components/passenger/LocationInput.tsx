import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Coordinates, PlaceSuggestion } from '../../types';
import { useTheme } from '../../theme';
import { Text, TextField } from '../ui';

interface Props {
  label: string;
  value: string;
  onChange: (text: string) => void;
  suggestions: PlaceSuggestion[];
  onSelect: (description: string) => void;
  onUseCurrentLocation?: () => void;
  currentLocationLabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  error?: string;
  /** True once a coordinate has been resolved for this field. */
  resolved?: boolean;
}

/**
 * An address field with inline suggestions.
 *
 * The suggestion list is rendered in flow rather than absolutely positioned.
 * The previous version stacked two absolute lists and fought them with
 * competing zIndex values, so the destination list could render underneath the
 * starting-point field and become untappable.
 */
const LocationInput = ({
  label,
  value,
  onChange,
  suggestions,
  onSelect,
  onUseCurrentLocation,
  currentLocationLabel,
  icon,
  loading = false,
  error,
  resolved = false,
}: Props) => {
  const theme = useTheme();
  const showSuggestions = value.trim().length > 0 && suggestions.length > 0;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <TextField
        label={label}
        icon={icon}
        value={value}
        onChangeText={onChange}
        error={error}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="search"
      />

      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="footnote" tone="muted">
            {`${label}…`}
          </Text>
        </View>
      ) : null}

      {resolved && !showSuggestions ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <Ionicons name="checkmark-circle" size={theme.size('footnote') + 2} color={theme.colors.success} />
          <Text variant="footnote" tone="success">
            {value}
          </Text>
        </View>
      ) : null}

      {showSuggestions ? (
        <View
          style={{
            borderRadius: theme.radius.md,
            borderWidth: theme.highContrast ? 2 : 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            overflow: 'hidden',
          }}
        >
          {suggestions.slice(0, 5).map((item, index) => (
            <Pressable
              key={item.place_id}
              accessibilityRole="button"
              accessibilityLabel={item.description}
              // Position is spoken because the list has no visible numbering
              // and a screen reader user cannot see how far down they are.
              accessibilityHint={`Suggestion ${index + 1} of ${Math.min(suggestions.length, 5)}`}
              onPress={() => onSelect(item.description)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
                minHeight: theme.touchTarget,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.border,
                backgroundColor: pressed ? theme.colors.surfacePressed : 'transparent',
              })}
            >
              <Ionicons name="location-outline" size={theme.size('title')} color={theme.colors.textMuted} />
              <Text variant="body" style={{ flex: 1 }} numberOfLines={2}>
                {item.description}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {onUseCurrentLocation && currentLocationLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={currentLocationLabel}
          onPress={onUseCurrentLocation}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            alignSelf: 'flex-start',
            minHeight: theme.touchTarget,
            paddingRight: theme.spacing.md,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="locate" size={theme.size('bodyLg')} color={theme.colors.primaryText} />
          <Text variant="footnote" weight="semibold" tone="primary">
            {currentLocationLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export default LocationInput;
