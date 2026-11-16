import prisma from '../configDB/prisma.js';
import { sendPushNotification } from '../services/notificationsService.js';

/**
 * Create a new passenger notification for a bus at a stop.
 */
export const createNotification = async (
  bus_id,
  bus_stop_id,
  user_id,
  timing,
  message,
  tracking = {}
) => {
  try {
    if (!bus_id || !bus_stop_id || !user_id) {
      throw new Error('bus_id, bus_stop_id, and user_id are required');
    }
    if (timing && !/^\d{2}:\d{2}:\d{2}$/.test(timing)) {
      throw new Error('timing must be in HH:mm:ss format');
    }
    if (!message || message.length > 255) {
      throw new Error('message is required and must not exceed 255 characters');
    }

    // Validate foreign keys
    const bus = await prisma.bus.findUnique({ where: { id: bus_id } });
    if (!bus) throw new Error('Invalid bus_id');

    const busStop = await prisma.busStop.findUnique({ where: { id: bus_stop_id } });
    if (!busStop) throw new Error('Invalid bus_stop_id');

    const user = await prisma.user.findUnique({ where: { id: user_id } });
    if (!user) throw new Error('Invalid user_id');

    // Prevent duplicate active notification for same bus/stop/user
    const existing = await prisma.notification.findFirst({
      where: {
        bus_id,
        bus_stop_id,
        user_id,
        status: { in: ['waiting', 'traveling'] },
      },
    });

    if (existing) {
      throw new Error('You already have an active notification for this bus and stop.');
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        bus_id,
        bus_stop_id,
        user_id,
        timing: timing ?? null,
        from_lat: tracking.from_lat ?? null,
        from_lng: tracking.from_lng ?? null,
        dest_lat: tracking.dest_lat ?? null,
        dest_lng: tracking.dest_lng ?? null,
        message,
        status: 'waiting',
      },
      include: {
        bus_stop: { select: { stop_name: true } },
        user: { select: { name: true } },
        bus: { select: { fare: true } },
      },
    });

    await prisma.payment.create({
      data: { notification_id: notification.id, amount: notification.bus.fare },
    });

    return {
      id: notification.id,
      bus_id: notification.bus_id,
      bus_stop_id: notification.bus_stop_id,
      bus_stop_name: notification.bus_stop.stop_name,
      user_id: notification.user_id,
      passenger_name: notification.user.name,
      timing: notification.timing,
      status: notification.status,
      message: notification.message,
      payment: { amount: notification.bus.fare, method: 'cash', status: 'paid' },
      from_lat: notification.from_lat,
      from_lng: notification.from_lng,
      dest_lat: notification.dest_lat,
      dest_lng: notification.dest_lng,
      created_at: notification.created_at,
    };
  } catch (err) {
    throw new Error(`Failed to create notification: ${err.message}`);
  }
};

/**
 * Fetch all notifications for a given bus, newest first.
 */
export const getBusNotifications = async (bus_id) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { bus_id },
      include: {
        bus_stop: { select: { id: true, stop_name: true } },
        user: { select: { id: true, name: true } },
        payment: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return notifications.map((n) => ({
      id: n.id,
      bus_id: n.bus_id,
      bus_stop_id: n.bus_stop?.id ?? null,
      bus_stop_name: n.bus_stop?.stop_name ?? null,
      user_id: n.user.id,
      passenger_name: n.user.name,
      timing: n.timing,
      status: n.status,
      message: n.message,
      payment: n.payment ?? { amount: 0, method: 'cash', status: 'paid' },
      created_at: n.created_at,
    }));
  } catch (err) {
    throw new Error(`Failed to fetch notifications: ${err.message}`);
  }
};

/**
 * Advance a notification status: waiting → traveling → completed.
 * Sends an Expo push notification to the passenger on each transition.
 */
export const updateNotificationStatus = async (notification_id, bus_id) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notification_id, bus_id },
      include: {
        user: { select: { id: true, name: true, expo_token: true } },
        bus_stop: { select: { stop_name: true } },
        payment: true,
      },
    });

    if (!notification) {
      throw new Error('Notification not found or not authorized for this bus');
    }

    let newStatus;
    if (notification.status === 'waiting') newStatus = 'traveling';
    else if (notification.status === 'traveling') newStatus = 'completed';
    else if (notification.status === 'completed') {
      // Already completed — return current state
      return {
        id: notification.id,
        bus_id: notification.bus_id,
        bus_stop_id: notification.bus_stop_id,
        bus_stop_name: notification.bus_stop?.stop_name ?? null,
        user_id: notification.user.id,
        passenger_name: notification.user.name,
        timing: notification.timing,
        status: notification.status,
        message: notification.message,
        payment: notification.payment ?? { amount: 0, method: 'cash', status: 'paid' },
        created_at: notification.created_at,
      };
    } else {
      throw new Error('Invalid notification status');
    }

    const updated = await prisma.notification.update({
      where: { id: notification_id },
      data: { status: newStatus },
      include: {
        bus_stop: { select: { stop_name: true } },
        user: { select: { id: true, name: true, expo_token: true } },
        payment: true,
      },
    });

    // Send push notification to passenger if they have an Expo token
    if (updated.user?.expo_token) {
      let title = '';
      let body = '';

      if (newStatus === 'traveling') {
        title = '🚍 Your bus has started!';
        body = `Hello ${updated.user.name}, your bus is now on the way from ${updated.bus_stop?.stop_name}.`;
      } else if (newStatus === 'completed') {
        title = '✅ Ride Completed!';
        body = `Hi ${updated.user.name}, your trip from ${updated.bus_stop?.stop_name} has been completed.`;
      }

      await sendPushNotification(updated.user.expo_token, title, body, {
        screen: 'BookingStatus',
        status: newStatus,
        bus_id: updated.bus_id,
        notification_id: updated.id,
      });
    }

    return {
      id: updated.id,
      bus_id: updated.bus_id,
      bus_stop_id: updated.bus_stop_id,
      bus_stop_name: updated.bus_stop?.stop_name ?? null,
      user_id: updated.user.id,
      passenger_name: updated.user.name,
      timing: updated.timing,
      status: updated.status,
      message: updated.message,
      payment: updated.payment ?? { amount: 0, method: 'cash', status: 'paid' },
      created_at: updated.created_at,
    };
  } catch (err) {
    throw new Error(`Failed to update notification status: ${err.message}`);
  }
};

/**
 * Save or update a passenger's Expo push token.
 */
export const savePushToken = async (user_id, expo_push_token) => {
  try {
    if (
      !expo_push_token ||
      typeof expo_push_token !== 'string' ||
      !expo_push_token.startsWith('ExponentPushToken[')
    ) {
      throw new Error('Invalid expo_push_token format');
    }

    const user = await prisma.user.update({
      where: { id: user_id },
      data: { expo_token: expo_push_token },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (err) {
    throw new Error(`Failed to save push token: ${err.message}`);
  }
};

/**
 * Fetch a passenger's own booking history, newest first.
 *
 * Only `normal` notifications are returned: those are the bookings the
 * passenger actually made. `start_travel` / `complete_travel` rows are
 * system messages raised by the conductor and carry no stop, so they would
 * render as blank entries in a trip list.
 *
 * @param {number} user_id
 * @param {number} limit
 */
export const getUserNotifications = async (user_id, limit = 50) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id, type: 'normal' },
      include: {
        bus_stop: { select: { id: true, stop_name: true } },
        bus: { select: { id: true, name: true, trip_code: true, wheelchair_accessible: true, fare: true } },
        payment: true,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return notifications.map((n) => ({
      id: n.id,
      bus_id: n.bus_id,
      bus_name: n.bus?.name ?? null,
      trip_code: n.bus?.trip_code ?? null,
      wheelchair_accessible: n.bus?.wheelchair_accessible ?? false,
      bus_stop_id: n.bus_stop?.id ?? null,
      bus_stop_name: n.bus_stop?.stop_name ?? null,
      timing: n.timing,
      status: n.status,
      message: n.message,
      payment: n.payment ?? { amount: n.bus?.fare ?? 0, method: 'cash', status: 'paid' },
      from_lat: n.from_lat,
      from_lng: n.from_lng,
      dest_lat: n.dest_lat,
      dest_lng: n.dest_lng,
      created_at: n.created_at,
    }));
  } catch (err) {
    throw new Error(`Failed to fetch trip history: ${err.message}`);
  }
};

export const updatePayment = async (user_id, notification_id, method) => {
  if (!['cash', 'gpay'].includes(method)) throw new Error('Payment method must be cash or gpay');

  const notification = await prisma.notification.findFirst({
    where: { id: notification_id, user_id, type: 'normal' },
    include: { bus: { select: { fare: true } } },
  });
  if (!notification) throw new Error('Trip not found');
  if (notification.status !== 'traveling') throw new Error('Payment is available after the journey starts');

  return prisma.payment.upsert({
    where: { notification_id },
    create: {
      notification_id,
      amount: notification.bus.fare,
      method,
      status: 'paid',
      paid_at: new Date(),
    },
    update: { method, status: 'paid', amount: notification.bus.fare, paid_at: new Date() },
  });
};
