import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type Feedback = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'select';

/**
 * Haptic feedback with a safe no-op on web.
 *
 * Touch feedback is a genuine accessibility affordance here, not decoration:
 * it confirms a press for users who cannot easily verify the screen changed,
 * and for anyone using the app one-handed on a moving bus.
 */
export const useHaptics = () => {
  return useCallback((type: Feedback = 'light') => {
    if (Platform.OS === 'web') return;

    switch (type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'select':
        Haptics.selectionAsync();
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);
};
