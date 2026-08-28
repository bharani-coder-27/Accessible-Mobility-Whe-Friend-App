import prisma from '../configDB/prisma.js';
import { sendPushNotification } from '../services/notificationsService.js';

/**
 * Create a new passenger notification for a bus at a stop.
 */
export const createNotification = async (bus_id, bus_stop_id, user_id, timing, message) => {
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
        message,
        status: 'waiting',
      },
      include: {
        bus_stop: { select: { stop_name: true } },
        user: { select: { name: true } },
      },
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
    } else {
      console.log(`⚠️ No Expo token for user ${notification.user.id}`);
    }

    console.log(`✅ Notification status updated to ${newStatus} for ID ${notification_id}`);

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
