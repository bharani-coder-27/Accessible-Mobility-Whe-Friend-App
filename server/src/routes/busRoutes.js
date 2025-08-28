import express from 'express';
import { getBusTimingsController, getNearestStops } from '../controllers/busesController.js';


const router = express.Router();

//router.get('/nearest', getNearestStops);
router.get('/bus_timings', getBusTimingsController);
router.get('/bus_stops', getNearestStops);

/*router.get('/available', protect, getAvailableBuses);
router.post('/book', protect, bookBus); */

export default router;