import express from 'express';
import { createNotificationHandler, getBusNotificationsHandler, updateNotificationStatusHandler, savePushTokenHandler } from '../controllers/notifyController.js';
import { startTravel, confirmTravel, completeTravel } from '../controllers/pushNotifications.js';
//import { protect } from '../middleware/authMiddleWare.js'; // Uncomment if authentication is needed

const router = express.Router();

// Create a notification (used by PassengerHomeScreen)
router.post('/', createNotificationHandler);

// Get pending notifications for a bus (for conductors)
// router.get('/:bus_id', protect, getPendingNotificationsHandler); // Use with authentication
router.get('/conductor/:bus_id', getBusNotificationsHandler); // No authentication

// Mark a notification as seen (for conductors)
// router.put('/:notification_id', protect, markNotificationAsSeenHandler); // Use with authentication
router.put('/markseen', updateNotificationStatusHandler); // No authentication

// Save Expo push token (used by mobile app)
router.post('/savePushToken', savePushTokenHandler);


// Push notification routes
router.post('/startTravel', startTravel);
router.post('/confirmTravel', confirmTravel);
router.post('/completeTravel', completeTravel);

export default router;