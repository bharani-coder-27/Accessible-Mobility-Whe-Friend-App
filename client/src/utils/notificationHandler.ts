// utils/notificationHandler.ts
import * as Notifications from 'expo-notifications';
import axios from '../services/api'; // Ensure this points to your axios instance
import { Alert } from 'react-native';

/**
 * Show notifications while the app is in the foreground.
 *
 * Called once at module scope so the handler is installed before any
 * notification can arrive, rather than racing the first screen's mount.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


// Define the structure of the data payload inside the notification
interface NotificationData {
  action?: 'confirmTravel' | 'travelComplete' | 'travelConfirmed';
  bus_id?: number;
  user_id?: number;
}

export const setupNotificationHandler = (): void => {
  Notifications.addNotificationResponseReceivedListener(
    async (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData;

      console.log('🔔 Notification clicked:', data);

      // 👉 When passenger receives "Confirm Travel" notification
      if (data.action === 'confirmTravel' && data.bus_id && data.user_id) {
        Alert.alert(
          'Confirm Travel',
          'Your bus journey is starting. Is this you?',
          [
            {
              text: 'No',
              onPress: () => console.log('❌ Passenger denied'),
              style: 'cancel',
            },
            {
              text: 'Yes, it’s me',
              onPress: async () => {
                try {
                  await axios.post(`/notify/confirmTravel`, {
                    user_id: data.user_id,
                    bus_id: data.bus_id,
                  });
                  Alert.alert('✅ Travel Confirmed', 'Thanks for confirming your journey!');
                } catch (error) {
                  console.error('Error confirming travel:', error);
                  Alert.alert('Error', 'Unable to confirm travel. Please try again.');
                }
              },
            },
          ],
          { cancelable: false }
        );
      }

      if (data.action === 'travelConfirmed') {
        Alert.alert('🎉 Confirmation Received', 'Your travel has been successfully confirmed.');
      }

      // 👉 When passenger receives "Travel Completed" notification
      if (data.action === 'travelComplete') {
        Alert.alert('🎉 Travel Completed', 'You have successfully reached your destination!');
      }
    }
  );

  console.log('✅ Notification handler initialized');
};
