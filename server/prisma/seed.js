import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client/index.js";
import { busStops, credentials, passengers, routes } from "./seedData/coimbatore.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CITY = "Coimbatore";
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** "HH:mm" → minutes since midnight. */
const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Minutes since midnight → "HH:mm:ss", the format BusTiming stores. */
const toClock = (minutes) => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
};

/**
 * Build every stop-level timing for one route.
 *
 * A service leaves the first stop every `headway` minutes and reaches each
 * later stop at its own offset, which is what makes the "next buses at this
 * stop" list differ sensibly from one stop to the next.
 */
const buildTimings = (route, busId, stopIdByName) => {
  const timings = [];
  const first = toMinutes(route.firstDeparture);
  const last = toMinutes(route.lastDeparture);

  for (let departure = first; departure <= last; departure += route.headway) {
    for (const stop of route.stops) {
      const stopId = stopIdByName.get(stop.stop_name);
      if (!stopId) continue;

      const arrival = departure + stop.offset;
      timings.push({
        bus_id: busId,
        bus_stop_id: stopId,
        arrival_time: toClock(arrival),
        // Two minutes of dwell time, so departure_time is not a copy of arrival.
        departure_time: toClock(arrival + 2),
        day_of_week: ALL_DAYS,
      });
    }
  }

  return timings;
};

const seedDB = async () => {
  try {
    console.log("🌱 Seeding the Coimbatore test network...\n");
    console.log("⚠️  This wipes existing users, buses, stops and notifications.\n");

    // Order matters: notifications and timings reference the rest.
    await prisma.notification.deleteMany();
    await prisma.busTiming.deleteMany();
    await prisma.user.deleteMany();
    await prisma.bus.deleteMany();
    await prisma.busStop.deleteMany();
    console.log("✅ Cleared existing data");

    // ─── Bus stops ──────────────────────────────────────────────────────────
    await prisma.busStop.createMany({
      data: busStops.map((stop) => ({ ...stop, city: CITY })),
    });

    const stopRecords = await prisma.busStop.findMany();
    const stopIdByName = new Map(stopRecords.map((stop) => [stop.stop_name, stop.id]));
    console.log(`✅ ${stopRecords.length} bus stops`);

    // ─── Buses, conductors and timings, one route at a time ─────────────────
    const conductorPassword = await bcrypt.hash(credentials.conductor, 10);
    const passengerPassword = await bcrypt.hash(credentials.passenger, 10);

    const created = [];
    let timingCount = 0;

    for (const route of routes) {
      const bus = await prisma.bus.create({
        data: {
          name: route.name,
          trip_code: route.trip_code,
          device_id: route.device_id,
          wheelchair_accessible: route.wheelchair_accessible,
          is_active: true,
        },
      });

      const conductor = await prisma.user.create({
        data: {
          name: route.conductor.name,
          email: route.conductor.email,
          phone_number: route.conductor.phone_number,
          dob: new Date(route.conductor.dob),
          password: conductorPassword,
          role: "conductor",
          is_active: true,
          from: route.stops[0].stop_name,
          to: route.stops[route.stops.length - 1].stop_name,
          trip_code: route.trip_code,
          class_of_service: route.class_of_service,
          device_id: route.device_id,
          // The link the conductor dashboard reads: without bus_id the
          // dashboard has no room to join and stays permanently empty.
          bus_id: bus.id,
        },
      });

      const timings = buildTimings(route, bus.id, stopIdByName);
      await prisma.busTiming.createMany({ data: timings });
      timingCount += timings.length;

      created.push({ route, bus, conductor, timings: timings.length });
    }

    console.log(`✅ ${created.length} buses, each with a conductor`);
    console.log(`✅ ${timingCount} bus timings`);

    // ─── Passengers ─────────────────────────────────────────────────────────
    const passengerRecords = [];
    for (const passenger of passengers) {
      passengerRecords.push(
        await prisma.user.create({
          data: {
            ...passenger,
            dob: new Date(passenger.dob),
            password: passengerPassword,
            role: "passenger",
            is_active: true,
          },
        })
      );
    }
    console.log(`✅ ${passengerRecords.length} passengers`);

    // ─── Sample bookings on route 12B ───────────────────────────────────────
    // One in each state, so the conductor's three tabs all have content on the
    // very first login rather than needing the passenger flow run three times.
    const demoBus = created[0].bus;
    const demoStates = [
      { status: "waiting", stop: "Ukkadam Bus Stand", timing: "09:00:00" },
      { status: "traveling", stop: "Town Hall", timing: "08:38:00" },
      { status: "completed", stop: "Race Course", timing: "08:17:00" },
    ];

    for (let index = 0; index < demoStates.length; index += 1) {
      const demo = demoStates[index];
      const passenger = passengerRecords[index];
      const stopId = stopIdByName.get(demo.stop);
      if (!passenger || !stopId) continue;

      await prisma.notification.create({
        data: {
          bus_id: demoBus.id,
          bus_stop_id: stopId,
          user_id: passenger.id,
          timing: demo.timing,
          message: `Passenger ${passenger.name} is waiting at ${demo.stop} for bus ${demoBus.name}`,
          status: demo.status,
          type: "normal",
        },
      });
    }
    console.log(`✅ ${demoStates.length} sample bookings on ${demoBus.trip_code}`);

    // ─── Summary ────────────────────────────────────────────────────────────
    console.log("\n🎉 Seed complete.\n");
    console.log("─".repeat(64));
    console.log("CONDUCTOR LOGINS   (password: %s)", credentials.conductor);
    console.log("─".repeat(64));
    for (const { route, conductor, timings } of created) {
      console.log(
        `  ${route.trip_code.padEnd(4)} ${conductor.email.padEnd(38)} ${
          route.wheelchair_accessible ? "♿ accessible" : "— not accessible"
        }`
      );
      console.log(
        `       ${route.stops[0].stop_name} → ${
          route.stops[route.stops.length - 1].stop_name
        }  ·  every ${route.headway} min  ·  ${timings} timings`
      );
    }

    console.log("\n" + "─".repeat(64));
    console.log("PASSENGER LOGINS   (password: %s)", credentials.passenger);
    console.log("─".repeat(64));
    for (const passenger of passengerRecords) {
      console.log(`  ${passenger.email.padEnd(38)} ${passenger.name}`);
    }

    console.log("\n" + "─".repeat(64));
    console.log("TRY THIS");
    console.log("─".repeat(64));
    console.log("  1. Sign in as anitha@whefriend.test (passenger).");
    console.log('  2. From "Ukkadam Bus Stand" → to "Gandhipuram Bus Stand".');
    console.log("  3. Pick Ukkadam Bus Stand, then a 12B departure.");
    console.log("  4. Sign in as murugan.conductor@whefriend.test on a second");
    console.log("     device or simulator — the booking appears live in Waiting.");
    console.log("─".repeat(64) + "\n");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

seedDB();
