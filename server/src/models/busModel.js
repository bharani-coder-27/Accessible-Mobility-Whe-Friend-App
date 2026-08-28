import prisma from '../configDB/prisma.js';

/**
 * Haversine formula to calculate distance in km between two lat/lon points.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get bus timings for a given bus stop from a given time onwards.
 * @param {number} stop_id
 * @param {string} formattedTime - HH:mm:ss
 */
export const getBusTimings = async (stop_id, formattedTime) => {
  try {
    const timings = await prisma.busTiming.findMany({
      where: {
        bus_stop_id: parseInt(stop_id),
        arrival_time: { gte: formattedTime },
      },
      include: {
        bus: {
          select: { id: true, name: true, trip_code: true, wheelchair_accessible: true },
        },
      },
      orderBy: { arrival_time: 'asc' },
    });

    return timings.map((timing) => ({
      bus_id: timing.bus.id,
      bus_name: timing.bus.name,
      arrival_time: timing.arrival_time,
      tripCode: timing.bus.trip_code,
      wheelchair_accessible: timing.bus.wheelchair_accessible,
    }));
  } catch (error) {
    console.error('Error fetching bus timings:', error);
    throw new Error('Failed to fetch bus timings');
  }
};

/**
 * Get bus stops within a given radius (metres) of a lat/lon point,
 * optionally filtered by city, sorted by distance.
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} radius - in metres
 * @param {string|undefined} city
 */
export const getNearBusStops = async (latitude, longitude, radius, city) => {
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }

  try {
    const radiusKm = radius / 1000;

    const allStops = await prisma.busStop.findMany({
      where: city ? { city } : undefined,
      select: {
        id: true,
        stop_name: true,
        latitude: true,
        longitude: true,
      },
    });

    const nearbyStops = allStops
      .map((stop) => ({
        id: stop.id,
        stop_name: stop.stop_name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        distance: calculateDistance(latitude, longitude, stop.latitude, stop.longitude),
      }))
      .filter((stop) => stop.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return nearbyStops;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};
