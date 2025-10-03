import {
  createNotification,
  getBusNotifications,
  updateNotificationStatus,
  savePushToken
} from '../models/notifyModel.js';
import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded; // { id, role, bus_id }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Passenger creates notification -> waiting
export const createNotificationHandler = async (req, res) => {
  const { bus_id, bus_stop_id, user_id, timing, message } = req.body;

  console.log('Create notification request body:', req.body);

  if (!bus_id || !bus_stop_id || !user_id || !timing || !message) {
    return res.status(400).json({ error: 'bus_id, bus_stop_id, user_id, timing, and message are required' });
  }

  try {
    const notification = await createNotification(
      parseInt(bus_id), parseInt(bus_stop_id), parseInt(user_id), timing, message
    );

    // Emit real-time update to conductors of the bus
    req.io.to(`bus_${bus_id}`).emit(`receiveNotification`, notification);

    res.status(201).json({ message: 'Notification created', notification });
  } catch (err) {
    console.error('Create notification error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

// Conductor fetches all notifications of bus
export const getBusNotificationsHandler = async (req, res) => {
  const { bus_id } = req.params;
  if (!bus_id || isNaN(parseInt(bus_id))) {
    return res.status(400).json({ error: 'bus_id must be a valid integer' });
  }

  try {
    const notifications = await getBusNotifications(parseInt(bus_id));
    res.status(200).json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Conductor marks -> waiting -> traveling -> completed
export const updateNotificationStatusHandler = async (req, res) => {
  const { notification_id, bus_id } = req.body;

  if (!notification_id || isNaN(parseInt(notification_id))) {
    return res.status(400).json({ error: 'notification_id must be a valid integer' });
  }

  try {
    const updated = await updateNotificationStatus(parseInt(notification_id), parseInt(bus_id));
    res.status(200).json({ message: 'Notification status updated', notification: updated });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update notification status' });
  }
};

export const savePushTokenHandler = async (req, res) => {
  const { user_id, expo_push_token } = req.body;

  if (!user_id || !expo_push_token) {
    return res.status(400).json({ error: 'user_id and expo_push_token are required' });
  }

  try {
    // Save the push token to the database or any storage
    await savePushToken(user_id, expo_push_token);
    res.status(200).json({ message: 'Push token saved successfully' });
  } catch (err) {
    console.error('Save push token error:', err);
    res.status(500).json({ error: 'Failed to save push token' });
  }
};


