import db from '../configDB/db.js';
import { sendPushNotification } from '../services/notificationsService.js';


export const createNotification = async (bus_id, bus_stop_id, user_id, timing, message) => {
  // Validate inputs
  if (!Number.isInteger(bus_id) || !Number.isInteger(bus_stop_id) || !Number.isInteger(user_id)) {
    throw new Error('bus_id, bus_stop_id, and user_id must be integers');
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(timing)) {
    throw new Error('timing must be in HH:mm:ss format');
  }
  if (!message || message.length > 255) {
    throw new Error('message is required and must not exceed 255 characters');
  }

  // Validate foreign keys
  const [[bus]] = await db.query('SELECT id FROM buses WHERE id = ?', [bus_id]);
  if (!bus) throw new Error('Invalid bus_id');
  const [[bus_stop]] = await db.query('SELECT id FROM bus_stops WHERE id = ?', [bus_stop_id]);
  if (!bus_stop) throw new Error('Invalid bus_stop_id');
  const [[user]] = await db.query('SELECT id FROM users WHERE id = ?', [user_id]);
  if (!user) throw new Error('Invalid user_id');

  // Prevent duplicate active notification for same stop/user
  const [[existing]] = await db.query(
    `SELECT id FROM notifications 
     WHERE bus_id = ? AND bus_stop_id = ? AND user_id = ? 
     AND status IN ('waiting', 'traveling')`,
    [bus_id, bus_stop_id, user_id]
  );
  if (existing) {
    throw new Error('You already have an active notification for this bus and stop.');
  }

  try {
    const [result] = await db.query(
      `INSERT INTO notifications (bus_id, bus_stop_id, user_id, timing, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'waiting', NOW())`,
      [bus_id, bus_stop_id, user_id, timing, message]
    );

    const [[notification]] = await db.query(
      `SELECT n.id, n.bus_id, n.bus_stop_id, n.user_id, n.timing, n.status, n.message, n.created_at,
              bs.stop_name AS bus_stop_name, u.name AS passenger_name
       FROM notifications n
       JOIN bus_stops bs ON n.bus_stop_id = bs.id
       JOIN users u ON n.user_id = u.id
       WHERE n.id = ?`,
      [result.insertId]
    );
    return notification;
  } catch (err) {
    throw new Error(`Failed to create notification: ${err.message}`);
  }
};

// Fetch ALL notifications for a bus
export const getBusNotifications = async (bus_id) => {
  if (!Number.isInteger(bus_id)) throw new Error('bus_id must be an integer');
  try {
    const [notifications] = await db.query(
      `SELECT n.id, n.bus_id, n.bus_stop_id, n.user_id, n.timing, n.status, n.message, n.created_at,
              bs.stop_name AS bus_stop_name, u.name AS passenger_name
       FROM notifications n
       JOIN bus_stops bs ON n.bus_stop_id = bs.id
       JOIN users u ON n.user_id = u.id
       WHERE n.bus_id = ?
       ORDER BY n.created_at DESC`,
      [bus_id]
    );
    return notifications;
  } catch (err) {
    throw new Error(`Failed to fetch notifications: ${err.message}`);
  }
};


// ✅ Conductor changes status: waiting -> traveling -> completed
export const updateNotificationStatus = async (notification_id, bus_id) => {
  if (!Number.isInteger(notification_id) || !Number.isInteger(bus_id)) {
    throw new Error('notification_id and bus_id must be integers');
  }

  try {
    // 1️⃣ Get current notification
    const [[notification]] = await db.query(
      `SELECT id, status, user_id FROM notifications WHERE id = ? AND bus_id = ?`,
      [notification_id, bus_id]
    );

    if (!notification) {
      throw new Error('Notification not found or not authorized for this bus');
    }

    // 2️⃣ Decide next status
    let newStatus;
    if (notification.status === 'waiting') newStatus = 'traveling';
    else if (notification.status === 'traveling') newStatus = 'completed';
    else if (notification.status === 'completed') return notification; // Already completed

    // 3️⃣ Update status in DB
    await db.query(
      `UPDATE notifications SET status = ? WHERE id = ? AND bus_id = ?`,
      [newStatus, notification_id, bus_id]
    );

    // 4️⃣ Fetch updated notification + passenger info
    const [[updated]] = await db.query(
      `SELECT n.id, n.bus_id, n.bus_stop_id, n.user_id, n.timing, n.status, n.message, n.created_at,
              bs.stop_name AS bus_stop_name, u.name AS passenger_name, u.expo_token
       FROM notifications n
       JOIN bus_stops bs ON n.bus_stop_id = bs.id
       JOIN users u ON n.user_id = u.id
       WHERE n.id = ?`,
      [notification_id]
    );

    // 5️⃣ Send push notification if passenger has Expo token
    if (updated?.expo_token) {
      let title = '';
      let body = '';

      if (newStatus === 'traveling') {
        title = '🚍 Your bus has started!';
        body = `Hello ${updated.passenger_name}, your bus is now on the way from ${updated.bus_stop_name}.`;
      } else if (newStatus === 'completed') {
        title = '✅ Ride Completed!';
        body = `Hi ${updated.passenger_name}, your trip from ${updated.bus_stop_name} has been completed.`;
      }

      await sendPushNotification(updated.expo_token, title, body, {
        screen: 'BookingStatus',
        status: newStatus,
        bus_id: updated.bus_id,
        notification_id: updated.id,
      });
    } else {
      console.log(`⚠️ No Expo token for user ${notification.user_id}`);
    }

    console.log(`✅ Notification status updated to ${newStatus} for ID ${notification_id}`);
    return updated;
  } catch (err) {
    throw new Error(`Failed to update notification status: ${err.message}`);
  }
};



export const savePushToken = async (user_id, expo_push_token) => {
  if (!Number.isInteger(user_id)) {
    throw new Error('user_id must be an integer');
  }
  if (!expo_push_token || typeof expo_push_token !== 'string' || !expo_push_token.startsWith('ExponentPushToken[')) {
    throw new Error('Invalid expo_push_token format');
  }
  try {
    // Upsert the push token
    await db.query(
      `UPDATE users SET expo_token = ? WHERE id = ?`,
      [expo_push_token, user_id]
    );
  } catch (err) {
    throw new Error(`Failed to save push token: ${err.message}`);
  }
};
