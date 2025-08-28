import { getBusTimings, getNearBusStops } from '../models/busModel.js';

// Get nearest bus stops
export const getNearestStops = async (req, res) => {
  const { latitude, longitude, radius = '5000', city } = req.query;
  console.log(req.query);

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const rad = parseFloat(radius);

      if (isNaN(lat) || isNaN(lon) || isNaN(rad)) {
        return res.status(400).json({ error: 'Invalid latitude, longitude, or radius' });
      }

      const stops = await getNearBusStops(lat, lon, rad, city);
      /* // Prioritize B K Pudur
      const bkPudurStop = stops.find(s => s.stop_name.toLowerCase().includes('b k pudur') || s.stop_name.toLowerCase().includes('bk pudur'));
      if (bkPudurStop) {
        stops.sort((a, b) => (a.stop_name === bkPudurStop.stop_name ? -1 : 1));
      } */

      return res.json(stops);
    } catch (err) {
      console.error('Error fetching nearby stops:', err.message);
      return res.status(500).json({ error: 'Server error' });
    }
};


// Get bus timings
export const getBusTimingsController = async (req, res) => {
    const { stop_id, current_time } = req.query;

    // Validate the required parameters
    if (!stop_id || !current_time) {
        return res.status(400).json({ error: 'stop_id and current_time query parameters are required.' });
    }

    // Format the current time for the SQL query
    const currentTime = new Date(current_time);
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    try {
        const timings = await getBusTimings(stop_id, formattedTime);
        console.log(`Successfully fetched timings for stop ID: ${stop_id}`);
        res.status(200).json(timings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bus timings' });
    }
};