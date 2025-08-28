import db from '../configDB/db.js';

export const getBusTimings = async (stop_id, formattedTime) => {
  try {
    const sqlQuery = `
            SELECT
              T1.id AS timing_id,
              T1.arrival_time,
              T2.id AS bus_id,
              T2.name AS bus_name,
              T2.tripCode AS trip_code,
              T2.wheelchair_accessible
            FROM bus_timings AS T1
            JOIN buses AS T2
              ON T1.bus_id = T2.id
            WHERE
              T1.stop_id = ? AND T1.arrival_time >= CURTIME()
            ORDER BY
              T1.arrival_time ASC;
        `;

        // Execute the query
        const [timingsRows] = await db.execute(sqlQuery, [stop_id]);

        // Map the results to the format the frontend expects
        return timingsRows.map(row => ({
            bus_id: row.bus_id.toString(),
            bus_name: row.bus_name,
            arrival_time: row.arrival_time,
            tripCode: row.trip_code,
            wheelchair_accessible: row.wheelchair_accessible
        }));
    } catch (error) {
        console.error('Error fetching bus timings:', error);
        throw new Error('Failed to fetch bus timings');
    }
};

// A simplified Haversine calculation for the final distance
const haversineSQL = `
    (6371 * acos(
      cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) +
      sin(radians(?)) * sin(radians(latitude))
    )) AS distance
`;

export const getNearBusStops = async (latitude, longitude, radius, city) => {
    if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
    }

    // Convert radius from meters to kilometers for the query
    const radiusKm = radius / 1000;

    // Calculate the bounding box coordinates
    const latDelta = radiusKm / 111.0; // 1 degree of latitude is approx 111 km
    const lonDelta = radiusKm / (111.0 * Math.cos(latitude * Math.PI / 180)); // 1 degree of longitude varies with latitude

    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLon = longitude - lonDelta;
    const maxLon = longitude + lonDelta;

    let query = `
        SELECT id, stop_name, latitude, longitude,
        ${haversineSQL}
        FROM bus_stops
        WHERE latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
    `;

    const params = [
        latitude,
        longitude,
        latitude,
        minLat,
        maxLat,
        minLon,
        maxLon,
    ];

    if (city) {
        query += ' AND city = ?';
        params.push(city);
    }

    query += `
        HAVING distance <= ?
        ORDER BY distance ASC
    `;
    params.push(radiusKm);

    try {
        const [rows] = await db.query(query, params);
        return rows.map(row => ({
            id: row.id.toString(),
            stop_name: row.stop_name,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            distance: parseFloat(row.distance),
        }));
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
};

