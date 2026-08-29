import prisma from '../configDB/prisma.js';

/**
 * Create a new user. For conductors, also finds or creates the associated bus
 * and links it to the user.
 * @returns {number} The new user's id
 */
export const createUser = async (
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
  deviceId
) => {
  try {
    // Create user without bus_id initially
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        dob: dob ? new Date(dob) : null,
        phone_number: phone_number ?? null,
        password,
        role,
        is_active: is_active ?? true,
        from: role === 'conductor' ? from : null,
        to: role === 'conductor' ? to : null,
        trip_code: role === 'conductor' ? tripCode : null,
        class_of_service: role === 'conductor' ? classOfService : null,
        device_id: role === 'conductor' ? deviceId : null,
      },
    });

    // For conductors, find or create the associated bus then link it
    if (role === 'conductor' && from && to && tripCode && classOfService && deviceId) {
      let bus = await prisma.bus.findUnique({ where: { device_id: deviceId } });

      if (!bus) {
        bus = await prisma.bus.create({
          data: {
            name: `${from}-${to}`,
            trip_code: tripCode,
            device_id: deviceId,
            wheelchair_accessible: false,
          },
        });
      }

      await prisma.user.update({
        where: { id: newUser.id },
        data: { bus_id: bus.id },
      });
    }

    return newUser.id;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

/**
 * Find a user by email address.
 * @returns {object|null} The user record or null
 */
export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};
/**
 * Find a user by id, without the password hash.
 * @returns {object|null} The user record or null
 */
export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      dob: true,
      phone_number: true,
      role: true,
      is_active: true,
      from: true,
      to: true,
      trip_code: true,
      class_of_service: true,
      device_id: true,
      bus_id: true,
      created_at: true,
    },
  });
};

/**
 * Update the editable fields of a user's own profile.
 *
 * Only the fields present in `fields` are written, so a partial update from
 * the profile screen never blanks out values it did not send. Identity fields
 * (email, role, password) are deliberately not editable here.
 *
 * @param {number} id
 * @param {object} fields
 * @returns {object} The updated user, without the password hash
 */
export const updateUserProfile = async (id, fields) => {
  const editable = ['name', 'phone_number', 'from', 'to', 'trip_code', 'class_of_service'];
  const data = {};

  for (const key of editable) {
    if (fields[key] !== undefined) data[key] = fields[key];
  }
  if (fields.dob !== undefined) {
    data.dob = fields.dob ? new Date(fields.dob) : null;
  }

  await prisma.user.update({ where: { id }, data });
  return findUserById(id);
};
