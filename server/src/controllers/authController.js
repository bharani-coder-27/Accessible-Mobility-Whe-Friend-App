import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../models/userModel.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, dob, phone_number, password, role, is_active, from, to, tripCode, classOfService, deviceId } = req.body;
    console.log(req.body);

    // Validate conductor-specific fields
    if (role === 'conductor' && (!from || !to || !tripCode || !classOfService || !deviceId)) {
      return res.status(400).json({ message: 'From, to, tripCode, classOfService, and deviceId are required for conductors' });
    }
    if (role === 'passenger' && (from || to || tripCode || classOfService || deviceId)) {
      return res.status(400).json({ message: 'Conductor-specific fields should not be provided for passengers' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await createUser(
      name,
      email,
      dob,
      phone_number,
      hashedPassword,
      role,
      is_active || 1, // Default to 1 if not provided
      role === 'conductor' ? from : null,
      role === 'conductor' ? to : null,
      role === 'conductor' ? tripCode : null,
      role === 'conductor' ? classOfService : null,
      role === 'conductor' ? deviceId : null // e.g., "MGR976883094"
    );

    res.status(201).json({ message: "User registered", userId });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, bus_id: user.bus_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};