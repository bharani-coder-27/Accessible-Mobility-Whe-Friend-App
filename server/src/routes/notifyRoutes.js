import express from 'express';
import { createNotificationHandler, getPendingNotificationsHandler, markNotificationAsSeenHandler } from '../controllers/notifyController.js';
//import { protect } from '../middleware/authMiddleWare.js'; // Uncomment if authentication is needed

const router = express.Router();

// Create a notification (used by PassengerHomeScreen)
router.post('/', createNotificationHandler);

// Get pending notifications for a bus (for conductors)
// router.get('/:bus_id', protect, getPendingNotificationsHandler); // Use with authentication
router.get('/conductor/:bus_id', getPendingNotificationsHandler); // No authentication

// Mark a notification as seen (for conductors)
// router.put('/:notification_id', protect, markNotificationAsSeenHandler); // Use with authentication
router.put('/markseen', markNotificationAsSeenHandler); // No authentication

export default router;