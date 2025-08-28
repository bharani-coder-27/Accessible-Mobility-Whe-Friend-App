import { createNotification, getPendingNotifications, markNotificationAsSeen } from '../models/notifyModel.js';
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

export const createNotificationHandler = async (req, res) => {
  const { bus_id, bus_stop_id, user_id, timing, message } = req.body;

  if (!bus_id || !bus_stop_id || !user_id || !timing || !message) {
    return res.status(400).json({ error: 'bus_id, bus_stop_id, user_id, timing, and message are required' });
  }

  try {
    const notification = await createNotification(parseInt(bus_id), parseInt(bus_stop_id), parseInt(user_id), timing, message);
    res.status(201).json({ message: 'Notification created', notification });
  } catch (err) {
    console.error('Create notification error:', err.message);
    if (err.message.includes('already created a notification')) {
      return res.status(400).json({ error: err.message }); // 👈 duplicate case
    }
    res.status(500).json({ error: 'Failed to create notification' });
  }
};


export const getPendingNotificationsHandler = async (req, res) => {
  const { bus_id } = req.params;
  if (!bus_id || isNaN(parseInt(bus_id))) {
    console.log(bus_id);
    return res.status(400).json({ error: 'bus_id must be a valid integer' });
  }
  /* if (!req.user || req.user.role !== 'conductor' || req.user.bus_id !== parseInt(bus_id)) {
    console.log('Access denied:', { user: req.user, requested_bus_id: bus_id });
    return res.status(403).json({ error: 'Access denied: You must be a conductor assigned to this bus' });
  } */

  try {
    console.log(`Fetching notifications for bus_id: ${bus_id}`);
    const notifications = await getPendingNotifications(parseInt(bus_id));
    console.log('Notifications fetched:', notifications);
    res.status(200).json(notifications); // Always return 200, even if empty
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsSeenHandler = async (req, res) => {
  const { notification_id, bus_id } = req.body;

  /* if (!req.user || req.user.role !== 'conductor' || !req.user.bus_id) {
    return res.status(403).json({ error: 'Access denied: Must be a conductor with an assigned bus' });
  } */
  if (!notification_id || isNaN(parseInt(notification_id))) {
    return res.status(400).json({ error: 'notification_id must be a valid integer' });
  }

  try {
    const updatedNotification = await markNotificationAsSeen(parseInt(notification_id), parseInt(bus_id));
    if (!updatedNotification) {
      console.log("Successfully Marked notification.")
      return res.status(404).json({ error: 'Notification not found or not authorized for this bus' });
    }
    res.status(200).json({ message: 'Notification marked as seen', notification: updatedNotification });
  } catch (err) {
    console.error('Mark as seen error:', err);
    res.status(500).json({ error: 'Failed to mark notification as seen' });
  }
};