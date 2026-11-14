import axios from 'axios';


// ✅ Helper: Send Push Notification to passenger via Expo API
export async function sendPushNotification(expo_token, title, body, data = {}) {
  try {
    await axios.post('https://exp.host/--/api/v2/push/send', {
      to: expo_token,
      sound: 'default',
      title,
      body,
      data, // Optional: for deep linking in passenger app
    });
  } catch (err) {
    console.error('❌ Error sending push notification:', err.message);
  }
}
