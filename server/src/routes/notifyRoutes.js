import express from 'express';
import { createNotificationHandler, getBusNotificationsHandler, updateNotificationStatusHandler, savePushTokenHandler, getMyNotificationsHandler } from '../controllers/notifyController.js';
import { startTravel, confirmTravel, completeTravel } from '../controllers/pushNotifications.js';
import { protect } from '../middleWare/authMiddleWare.js';

const router = express.Router();

// Create a notification (used by PassengerHomeScreen)
router.post('/', protect, createNotificationHandler);

// Get pending notifications for a bus (for conductors)
// router.get('/:bus_id', protect, getPendingNotificationsHandler); // Use with authentication
router.get('/conductor/:bus_id', getBusNotificationsHandler); // No authentication

// Mark a notification as seen (for conductors)
// router.put('/:notification_id', protect, markNotificationAsSeenHandler); // Use with authentication
router.put('/markseen', updateNotificationStatusHandler); // No authentication

// Passenger's own trip history. Protected, and scoped to req.user.id so a
// passenger can only ever read their own trips.
router.get('/history', protect, getMyNotificationsHandler);

// Save Expo push token (used by mobile app)
router.post('/savePushToken', savePushTokenHandler);


// Push notification routes
router.post('/startTravel', startTravel);
router.post('/confirmTravel', confirmTravel);
router.post('/completeTravel', completeTravel);

export default router;