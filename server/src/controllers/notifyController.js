import {
  createNotification,
  getBusNotifications,
  updateNotificationStatus,
  savePushToken,
  getUserNotifications,
  updatePayment
} from '../models/notifyModel.js';


// Passenger creates notification -> waiting
export const createNotificationHandler = async (req, res) => {
  const { bus_id, bus_stop_id, timing, message, from_lat, from_lng, dest_lat, dest_lng } = req.body;

  // The passenger is taken from the verified token, never the request body.
  // Trusting the body let a client book on behalf of anyone, and let a stale
  // cached session keep sending an id whose user had since been deleted.
  const user_id = req.user.id;

  if (!bus_id || !bus_stop_id || !timing || !message) {
    return res.status(400).json({ error: 'bus_id, bus_stop_id, timing, and message are required' });
  }

  try {
    const notification = await createNotification(
      parseInt(bus_id), parseInt(bus_stop_id), parseInt(user_id), timing, message,
      { from_lat, from_lng, dest_lat, dest_lng }
    );

    // Emit real-time update to conductors of the bus
    req.io.to(`bus_${bus_id}`).emit(`receiveNotification`, notification);

    res.status(201).json({ message: 'Notification created', notification });
  } catch (err) {
    console.error('Create notification error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

export const updatePaymentHandler = async (req, res) => {
  const { notification_id, method } = req.body;
  if (!notification_id || !['cash', 'gpay'].includes(method)) {
    return res.status(400).json({ error: 'notification_id and a valid payment method are required' });
  }

  try {
    const payment = await updatePayment(req.user.id, parseInt(notification_id), method);
    res.status(200).json({ payment });
  } catch (err) {
    console.error('Update payment error:', err);
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



// Passenger fetches their own booking history
export const getMyNotificationsHandler = async (req, res) => {
  try {
    const trips = await getUserNotifications(req.user.id);
    res.status(200).json(trips);
  } catch (err) {
    console.error('Fetch trip history error:', err);
    res.status(500).json({ error: 'Failed to fetch trip history' });
  }
};
