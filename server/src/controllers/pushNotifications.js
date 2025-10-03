import db from '../configDB/db.js';
import { sendPushNotification } from '../services/notificationsService.js';


// ✅ Start Travel (triggered by conductor

export const startTravel = async (req, res) => {
  const { bus_id, user_id } = req.body;
  console.log(req.body);

  try {
    // 🔹 Step 1: Get passenger token
    const [userResult] = await db.query(
      'SELECT expo_token FROM users WHERE id = ?',
      [user_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Passenger not found' });
    }

    const token = userResult[0].expo_token;
    console.log('🎯 Passenger token:', token);

    // 🔹 Step 2: Insert notification into DB
    const message = 'Your bus journey is starting. Please confirm if it’s you.';
    await db.query(
      'INSERT INTO notifications (bus_id, user_id, message, status, type, travel_status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [bus_id, user_id, message, 'sent', 'start_travel', 'pending']
    );

    console.log('📩 Notification inserted');

    // 🔹 Step 3: Send Expo push notification
    await sendPushNotification(token, 'Confirm Your Travel', message, {
      action: 'confirmTravel',
      bus_id,
      user_id,
    });

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
    // Update travel status
    await db.query(
      'UPDATE notifications SET travel_status = ? WHERE bus_id = ? AND user_id = ? AND type = ?',
      ['confirmed', bus_id, user_id, 'start_travel']
    );

    // Get passenger expo token
    const [userResult] = await db.query(
      'SELECT expo_token FROM users WHERE id = ?',
      [user_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Passenger not found' });
    }

    const token = userResult[0].expo_token;

    // Send success acknowledgment
    await sendPushNotification(
      token,
      '✅ Travel Confirmed',
      'Thank you for confirming your journey!',
      {
        action: 'travelConfirmed',
        bus_id,
        user_id,
      }
    );

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
    // 1️⃣ Prepare message
    const message = 'You have successfully completed your travel.';

    // 2️⃣ Insert notification into DB
    await db.query(
      'INSERT INTO notifications (bus_id, user_id, message, status, type, travel_status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [bus_id, user_id, message, 'sent', 'complete_travel', 'completed']
    );

    // 3️⃣ Fetch passenger token
    const [userResult] = await db.query('SELECT expo_token FROM users WHERE id = ?', [user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Passenger not found' });
    }

    const token = userResult[0].expo_token;

    // 4️⃣ Send push notification to passenger
    await sendPushNotification(token, '✅ Travel Completed', message, {
      action: 'travelComplete',
      user_id,
      bus_id,
    });

    console.log(`✅ Travel completion notification sent to user ${user_id}`);
    return res.status(200).json({ message: 'Travel completion notified successfully' });
  } catch (err) {
    console.error('❌ completeTravel error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
