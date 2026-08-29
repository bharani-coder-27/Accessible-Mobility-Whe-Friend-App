import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
} from '../models/userModel.js';

/** Sign a session token for a user record. */
const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, bus_id: user.bus_id ?? null }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

/** The user shape the client is allowed to see — never includes the password hash. */
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone_number: user.phone_number,
  dob: user.dob,
  role: user.role,
  bus_id: user.bus_id ?? null,
  from: user.from ?? null,
  to: user.to ?? null,
  trip_code: user.trip_code ?? null,
  class_of_service: user.class_of_service ?? null,
});

export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      dob,
      phone_number,
      password,
      role,
      is_active,
      from,
      to,
      tripCode,
      classOfService,
      deviceId,
    } = req.body;

    // Validate conductor-specific fields
    if (role === 'conductor' && (!from || !to || !tripCode || !classOfService || !deviceId)) {
      return res.status(400).json({
        message: 'From, to, tripCode, classOfService, and deviceId are required for conductors',
      });
    }
    if (role === 'passenger' && (from || to || tripCode || classOfService || deviceId)) {
      return res
        .status(400)
        .json({ message: 'Conductor-specific fields should not be provided for passengers' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const isActive =
      is_active === undefined ||
      is_active === null ||
      is_active === true ||
      is_active === 1 ||
      is_active === '1' ||
      is_active === 'true';
    const userId = await createUser(
      name,
      email,
      dob,
      phone_number,
      hashedPassword,
      role,
      isActive,
      role === 'conductor' ? from : null,
      role === 'conductor' ? to : null,
      role === 'conductor' ? tripCode : null,
      role === 'conductor' ? classOfService : null,
      role === 'conductor' ? deviceId : null
    );

    // Return a session so the app can drop the user straight into the product
    // instead of bouncing them to the login screen to retype what they just typed.
    const user = await findUserById(userId);

    res.status(201).json({
      message: 'User registered',
      userId,
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

/** Return the signed-in user's own profile. */
export const me = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

/** Update the signed-in user's own profile. */
export const updateMe = async (req, res, next) => {
  try {
    const { name, phone_number, dob, from, to, trip_code, class_of_service } = req.body;

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    if (phone_number !== undefined && phone_number && !/^[0-9]{10}$/.test(phone_number)) {
      return res.status(400).json({ message: 'Phone number must be 10 digits' });
    }
    if (dob !== undefined && dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return res.status(400).json({ message: 'Date of birth must be in YYYY-MM-DD format' });
    }

    const updated = await updateUserProfile(req.user.id, {
      name,
      phone_number,
      dob,
      from,
      to,
      trip_code,
      class_of_service,
    });

    res.json({ message: 'Profile updated', user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
};
