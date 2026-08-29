/**
 * Mock Coimbatore network used to seed a testable database.
 *
 * Coordinates are real-world positions for these localities, so distances
 * between stops, the 5 km "nearby stops" radius and the map view all behave
 * the way they would against live data. The client's mock geocoder
 * (src/services/googleApi.ts) resolves the same places to the same points, so
 * the whole passenger flow can be exercised without a Google Maps key.
 */

/** @type {{stop_name: string, latitude: number, longitude: number, area: string}[]} */
export const busStops = [
  // ── South and south-west ────────────────────────────────────────────────
  { stop_name: "Ukkadam Bus Stand", latitude: 10.9895, longitude: 76.956, area: "Ukkadam" },
  { stop_name: "Sungam", latitude: 10.9822, longitude: 76.9628, area: "Sungam" },
  { stop_name: "Athupalam", latitude: 10.9723, longitude: 76.9601, area: "Athupalam" },
  { stop_name: "Kurichi", latitude: 10.941, longitude: 76.96, area: "Kurichi" },
  { stop_name: "Kuniyamuthur", latitude: 10.9432, longitude: 76.9297, area: "Kuniyamuthur" },
  { stop_name: "Podanur Junction", latitude: 10.9525, longitude: 76.949, area: "Podanur" },
  { stop_name: "Madukkarai", latitude: 10.906, longitude: 76.956, area: "Madukkarai" },
  { stop_name: "Kovaipudur", latitude: 10.92, longitude: 76.906, area: "Kovaipudur" },
  { stop_name: "Selvapuram", latitude: 10.9784, longitude: 76.9391, area: "Selvapuram" },
  { stop_name: "Telungupalayam Pirivu", latitude: 10.9829, longitude: 76.927, area: "Telungupalayam" },
  { stop_name: "Perur", latitude: 10.9748, longitude: 76.9033, area: "Perur" },

  // ── City centre ─────────────────────────────────────────────────────────
  { stop_name: "Sukrawarpet", latitude: 10.9915, longitude: 76.9585, area: "Sukrawarpet" },
  { stop_name: "Poomarket", latitude: 10.9938, longitude: 76.9607, area: "Poomarket" },
  { stop_name: "Town Hall", latitude: 10.9973, longitude: 76.9601, area: "Town Hall" },
  { stop_name: "Coimbatore Junction Railway Station", latitude: 10.9962, longitude: 76.9663, area: "Railway Station" },
  { stop_name: "Race Course", latitude: 11.0009, longitude: 76.9707, area: "Race Course" },
  { stop_name: "Gandhipuram Bus Stand", latitude: 11.0183, longitude: 76.9725, area: "Gandhipuram" },
  { stop_name: "Mofussil Bus Stand", latitude: 11.0166, longitude: 76.9756, area: "Gandhipuram" },
  { stop_name: "R.S. Puram", latitude: 11.0055, longitude: 76.949, area: "R.S. Puram" },
  { stop_name: "Saibaba Colony", latitude: 11.023, longitude: 76.945, area: "Saibaba Colony" },
  { stop_name: "Ramanathapuram", latitude: 10.9924, longitude: 76.9862, area: "Ramanathapuram" },

  // ── Avinashi Road corridor (east) ───────────────────────────────────────
  { stop_name: "Lakshmi Mills Junction", latitude: 11.011, longitude: 76.98, area: "Lakshmi Mills" },
  { stop_name: "Uppilipalayam", latitude: 11.014, longitude: 76.993, area: "Uppilipalayam" },
  { stop_name: "Nehru Stadium", latitude: 11.027, longitude: 76.999, area: "Nehru Stadium" },
  { stop_name: "Hopes College", latitude: 11.0244, longitude: 76.9975, area: "Hopes College" },
  { stop_name: "Peelamedu", latitude: 11.0284, longitude: 77.0006, area: "Peelamedu" },
  { stop_name: "PSG College of Technology", latitude: 11.0243, longitude: 77.0025, area: "Peelamedu" },
  { stop_name: "SITRA", latitude: 11.033, longitude: 77.0169, area: "SITRA" },
  { stop_name: "Singanallur Bus Stand", latitude: 11.0089, longitude: 77.0289, area: "Singanallur" },
  { stop_name: "Ondipudur", latitude: 11.004, longitude: 77.047, area: "Ondipudur" },
  { stop_name: "Irugur", latitude: 11.014, longitude: 77.062, area: "Irugur" },
  { stop_name: "Vellalore", latitude: 10.954, longitude: 77.009, area: "Vellalore" },
  { stop_name: "Sulur", latitude: 11.0244, longitude: 77.1264, area: "Sulur" },

  // ── North and west ──────────────────────────────────────────────────────
  { stop_name: "Ganapathy", latitude: 11.04, longitude: 76.986, area: "Ganapathy" },
  { stop_name: "Saravanampatty", latitude: 11.0784, longitude: 76.9998, area: "Saravanampatty" },
  { stop_name: "G.N. Mills", latitude: 11.0466, longitude: 76.9497, area: "G.N. Mills" },
  { stop_name: "Kavundampalayam", latitude: 11.0407, longitude: 76.9316, area: "Kavundampalayam" },
  { stop_name: "Thudiyalur", latitude: 11.0704, longitude: 76.9403, area: "Thudiyalur" },
  { stop_name: "Vadavalli", latitude: 11.0206, longitude: 76.898, area: "Vadavalli" },
];

/**
 * Four routes, each operated by one bus with one conductor.
 *
 * `offset` is minutes from the departure at the first stop. `headway` is the
 * gap between consecutive departures, and services run from `firstDeparture`
 * to `lastDeparture` so there is always an upcoming bus whatever time of day
 * the app is opened.
 *
 * Route 1C is deliberately not wheelchair accessible: the passenger screens
 * label accessibility per bus, and that path needs something to show.
 */
export const routes = [
  {
    name: "12B Ukkadam - Gandhipuram",
    trip_code: "12B",
    device_id: "CBE12B001",
    wheelchair_accessible: true,
    class_of_service: "Low Floor Bus",
    headway: 15,
    firstDeparture: "05:30",
    lastDeparture: "22:30",
    stops: [
      { stop_name: "Ukkadam Bus Stand", offset: 0 },
      { stop_name: "Sukrawarpet", offset: 3 },
      { stop_name: "Poomarket", offset: 5 },
      { stop_name: "Town Hall", offset: 8 },
      { stop_name: "Coimbatore Junction Railway Station", offset: 12 },
      { stop_name: "Race Course", offset: 17 },
      { stop_name: "Gandhipuram Bus Stand", offset: 24 },
    ],
    conductor: {
      name: "Murugan Selvaraj",
      email: "murugan.conductor@whefriend.test",
      phone_number: "9843012001",
      dob: "1985-04-12",
    },
  },
  {
    name: "S17 Perur - Gandhipuram",
    trip_code: "S17",
    device_id: "CBES17002",
    wheelchair_accessible: true,
    class_of_service: "Low Floor Bus",
    headway: 20,
    firstDeparture: "05:45",
    lastDeparture: "22:15",
    stops: [
      { stop_name: "Perur", offset: 0 },
      { stop_name: "Telungupalayam Pirivu", offset: 6 },
      { stop_name: "Selvapuram", offset: 10 },
      { stop_name: "Ukkadam Bus Stand", offset: 18 },
      { stop_name: "Town Hall", offset: 24 },
      { stop_name: "R.S. Puram", offset: 30 },
      { stop_name: "Gandhipuram Bus Stand", offset: 38 },
    ],
    conductor: {
      name: "Lakshmi Ramanathan",
      email: "lakshmi.conductor@whefriend.test",
      phone_number: "9843012002",
      dob: "1990-09-23",
    },
  },
  {
    name: "70 Gandhipuram - Singanallur",
    trip_code: "70",
    device_id: "CBE070003",
    wheelchair_accessible: true,
    class_of_service: "Low Floor AC Bus",
    headway: 12,
    firstDeparture: "05:15",
    lastDeparture: "23:00",
    stops: [
      { stop_name: "Gandhipuram Bus Stand", offset: 0 },
      { stop_name: "Lakshmi Mills Junction", offset: 7 },
      { stop_name: "Uppilipalayam", offset: 12 },
      { stop_name: "Hopes College", offset: 16 },
      { stop_name: "Peelamedu", offset: 20 },
      { stop_name: "PSG College of Technology", offset: 23 },
      { stop_name: "Singanallur Bus Stand", offset: 31 },
    ],
    conductor: {
      name: "Arun Kumar",
      email: "arun.conductor@whefriend.test",
      phone_number: "9843012003",
      dob: "1988-01-30",
    },
  },
  {
    name: "1C Ukkadam - Saravanampatty",
    trip_code: "1C",
    device_id: "CBE01C004",
    wheelchair_accessible: false,
    class_of_service: "Standard Floor Bus",
    headway: 20,
    firstDeparture: "05:30",
    lastDeparture: "22:00",
    stops: [
      { stop_name: "Ukkadam Bus Stand", offset: 0 },
      { stop_name: "Town Hall", offset: 7 },
      { stop_name: "Gandhipuram Bus Stand", offset: 16 },
      { stop_name: "Ganapathy", offset: 26 },
      { stop_name: "Saravanampatty", offset: 40 },
    ],
    conductor: {
      name: "Devi Prakash",
      email: "devi.conductor@whefriend.test",
      phone_number: "9843012004",
      dob: "1992-06-08",
    },
  },
];

/** Test passenger accounts. */
export const passengers = [
  {
    name: "Anitha Murugesan",
    email: "anitha@whefriend.test",
    phone_number: "9843020001",
    dob: "1994-03-17",
  },
  {
    name: "Ravi Kannan",
    email: "ravi@whefriend.test",
    phone_number: "9843020002",
    dob: "1979-11-05",
  },
  {
    name: "Priya Sundaram",
    email: "priya@whefriend.test",
    phone_number: "9843020003",
    dob: "2000-08-21",
  },
];

/** Shared passwords, so the seed output can print working credentials. */
export const credentials = {
  conductor: "Conductor@123",
  passenger: "Passenger@123",
};
