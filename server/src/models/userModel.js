import pool from '../configDB/db.js';

export const createUser = async (name, email, dob, phoneNumber, password, role, isActive, from, to, tripCode, classOfService, deviceId) => {
  try {

    // Insert user without bus_id
    const [result] = await pool.query(
      'INSERT INTO users (name, email, dob, phone_number, password, role, is_active, `from`, `to`, tripCode, classOfService) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, dob, phoneNumber, password, role, isActive, from, to, tripCode, classOfService]
    );
    const userId = result.insertId;

    // For conductors, handle bus creation/lookup
    if (role === 'conductor' && from && to && tripCode && classOfService && deviceId) {
      // Check if bus exists for deviceId
      const [busResult] = await pool.query(
        'SELECT id FROM buses WHERE deviceId = ?',
        [deviceId]
      );
      let busId;

      if (busResult.length > 0) {
        // Use existing bus
        busId = busResult[0].id;
      } else {
        // Create new bus
        const [newBus] = await pool.query(
          'INSERT INTO buses (name, tripCode, deviceId, wheelchair_accessible) VALUES (?, ?, ?, ?)',
          [`${from}-${to}`, tripCode, deviceId, 0]
        );
        busId = newBus.insertId;
      }

      // Update user's bus_id
      await pool.query(
        'UPDATE users SET bus_id = ? WHERE id = ?',
        [busId, userId]
      );
    }
    
    return userId;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};