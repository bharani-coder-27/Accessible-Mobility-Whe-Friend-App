import prisma from '../configDB/prisma.js';
import { sendPushNotification } from '../services/notificationsService.js';

// ✅ Start Travel (triggered by conductor)
export const startTravel = async (req, res) => {
  const { bus_id, user_id } = req.body;
  console.log(req.body);

  try {
    // Step 1: Get passenger token
    const user = await prisma.user.findUnique({
      where: { id: parseInt(user_id) },
      select: { id: true, expo_token: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Passenger not found' });
    }

    const token = user.expo_token;
    console.log('🎯 Passenger token:', token);

    // Step 2: Insert notification into DB
    const message = "Your bus journey is starting. Please confirm if it's you.";
    await prisma.notification.create({
      data: {
        bus_id: parseInt(bus_id),
        user_id: parseInt(user_id),
        message,
        status: 'sent',
        type: 'start_travel',
        travel_status: 'pending',
      },
    });
    console.log('📩 Notification inserted');

    // Step 3: Send Expo push notification
    if (token) {
      await sendPushNotification(token, 'Confirm Your Travel', message, {
        action: 'confirmTravel',
        bus_id,
        user_id,
      });
    }

    console.log('✅ Push notification sent');
    return res.status(200).json({ message: 'Notification sent for confirmation' });
  } catch (error) {
    console.error('❌ startTravel error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Passenger confirms travel
export const confirmTravel = async (req, res) => {
  const { bus_id, user_id } = req.body;

  try {
    // Update travel status on all matching start_travel notifications
    await prisma.notification.updateMany({
      where: {
        bus_id: parseInt(bus_id),
        user_id: parseInt(user_id),
        type: 'start_travel',
      },
      data: { travel_status: 'confirmed' },
    });

    // Get passenger expo token
    const user = await prisma.user.findUnique({
      where: { id: parseInt(user_id) },
      select: { expo_token: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Passenger not found' });
    }

    // Send success acknowledgment
    if (user.expo_token) {
      await sendPushNotification(
        user.expo_token,
        '✅ Travel Confirmed',
        'Thank you for confirming your journey!',
        {
          action: 'travelConfirmed',
          bus_id,
          user_id,
        }
      );
    }

    console.log(`✅ Travel confirmed by passenger ${user_id}`);
    return res.status(200).json({ message: 'Travel confirmed successfully' });
  } catch (error) {
    console.error('❌ confirmTravel error:', error);
    return res.status(500).json({ message: 'Error confirming travel' });
  }
};

// ✅ Complete Travel
export const completeTravel = async (req, res) => {
  const { user_id, bus_id } = req.body;

  try {
    const message = 'You have successfully completed your travel.';

    // Insert completion notification
    await prisma.notification.create({
      data: {
        bus_id: parseInt(bus_id),
        user_id: parseInt(user_id),
        message,
        status: 'sent',
        type: 'complete_travel',
        travel_status: 'completed',
      },
    });

    // Fetch passenger token
    const user = await prisma.user.findUnique({
      where: { id: parseInt(user_id) },
      select: { expo_token: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Passenger not found' });
    }

    // Send push notification to passenger
    if (user.expo_token) {
      await sendPushNotification(user.expo_token, '✅ Travel Completed', message, {
        action: 'travelComplete',
        user_id,
        bus_id,
      });
    }

    console.log(`✅ Travel completion notification sent to user ${user_id}`);
    return res.status(200).json({ message: 'Travel completion notified successfully' });
  } catch (err) {
    console.error('❌ completeTravel error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
