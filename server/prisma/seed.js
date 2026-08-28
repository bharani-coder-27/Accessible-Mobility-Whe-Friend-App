import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const seedDB = async () => {
  try {
    console.log("🌱 Starting database seed...");

    // ─── Clean existing data (order matters due to FK constraints) ─────────────
    await prisma.notification.deleteMany();
    await prisma.busTiming.deleteMany();
    await prisma.user.deleteMany();
    await prisma.bus.deleteMany();
    await prisma.busStop.deleteMany();
    console.log("✅ Cleared existing data");

    // ─── Bus Stops ─────────────────────────────────────────────────────────────
    const busStopsJsonPath = path.join(__dirname, "..", "..", "bus_stops.json");

    let busStops = [];
    if (fs.existsSync(busStopsJsonPath)) {
      const rawData = JSON.parse(fs.readFileSync(busStopsJsonPath, "utf-8"));
      const importedStops = rawData.flatMap((route) =>
        Array.isArray(route.stops) ? route.stops : [route]
      );
      const stopsWithCoordinates = importedStops.filter(
        (stop) =>
          (stop.stop_name || stop.stopName || stop.name) &&
          Number.isFinite(Number(stop.latitude)) &&
          Number.isFinite(Number(stop.longitude))
      );

      if (stopsWithCoordinates.length > 0) {
        busStops = await Promise.all(
          stopsWithCoordinates.map((stop) =>
            prisma.busStop.create({
              data: {
                stop_name: stop.stop_name || stop.stopName || stop.name,
                latitude: Number(stop.latitude),
                longitude: Number(stop.longitude),
                city: stop.city || null,
                area: stop.area || null,
              },
            })
          )
        );
        console.log(`✅ Seeded ${busStops.length} bus stops from bus_stops.json`);
      }
    }

    if (busStops.length === 0) {
      // Fallback: seed Coimbatore stops manually
      const coimbatoreStops = [
        { stop_name: "Ukkadam Bus Stand", latitude: 10.9629, longitude: 76.9402, city: "Coimbatore", area: "Ukkadam" },
        { stop_name: "Kuniyamuthur Main Junction", latitude: 10.9579, longitude: 76.9541, city: "Coimbatore", area: "Kuniyamuthur" },
        { stop_name: "Gandhipuram Bus Stand", latitude: 11.0076, longitude: 76.9611, city: "Coimbatore", area: "Gandhipuram" },
        { stop_name: "Peelamedu Market", latitude: 10.9809, longitude: 76.9537, city: "Coimbatore", area: "Peelamedu" },
        { stop_name: "Race Course", latitude: 10.9876, longitude: 76.9624, city: "Coimbatore", area: "Race Course" },
        { stop_name: "Saravanampatty", latitude: 10.9451, longitude: 76.9284, city: "Coimbatore", area: "Saravanampatty" },
        { stop_name: "Marudanchavadi", latitude: 10.9516, longitude: 76.9602, city: "Coimbatore", area: "Marudanchavadi" },
        { stop_name: "Mofussil Bus Stand", latitude: 10.9989, longitude: 76.9714, city: "Coimbatore", area: "Mofussil" },
      ];

      busStops = await Promise.all(coimbatoreStops.map((s) => prisma.busStop.create({ data: s })));
      console.log(`✅ Seeded ${busStops.length} Coimbatore bus stops (fallback)`);
    }

    // ─── Buses ─────────────────────────────────────────────────────────────────
    const sampleBuses = await prisma.bus.createMany({
      data: [
        { name: "Ukkadam-Kuniyamuthur Express", trip_code: "UCE001", device_id: "TMT001", wheelchair_accessible: true, is_active: true },
        { name: "Ukkadam-Kuniyamuthur Local", trip_code: "UCL001", device_id: "TMT002", wheelchair_accessible: true, is_active: true },
        { name: "Kuniyamuthur-Gandhipuram", trip_code: "KG001", device_id: "TMT003", wheelchair_accessible: false, is_active: true },
        { name: "Ukkadam-Mofussil", trip_code: "UM001", device_id: "TMT004", wheelchair_accessible: true, is_active: true },
      ],
    });
    const buses = await prisma.bus.findMany();
    console.log(`✅ Seeded ${sampleBuses.count} buses`);

    // ─── Bus Timings ───────────────────────────────────────────────────────────
    const ukkadamStop = busStops.find((s) => s.stop_name === "Ukkadam Bus Stand");
    const kuniyamuthurStop = busStops.find((s) => s.stop_name === "Kuniyamuthur Main Junction");
    const peelameduStop = busStops.find((s) => s.stop_name === "Peelamedu Market");
    const racecourseStop = busStops.find((s) => s.stop_name === "Race Course");
    const gandhipuramStop = busStops.find((s) => s.stop_name === "Gandhipuram Bus Stand");
    const mofussilStop = busStops.find((s) => s.stop_name === "Mofussil Bus Stand");

    const expressBus = buses.find((b) => b.trip_code === "UCE001");
    const localBus = buses.find((b) => b.trip_code === "UCL001");
    const kgBus = buses.find((b) => b.trip_code === "KG001");
    const umBus = buses.find((b) => b.trip_code === "UM001");

    const timings = [];

    if (ukkadamStop && kuniyamuthurStop && peelameduStop) {
      // UCE001 Express — hourly 6am-10pm
      for (let hour = 6; hour <= 22; hour++) {
        const h = String(hour).padStart(2, "0");
        timings.push({ bus_id: expressBus.id, bus_stop_id: ukkadamStop.id, arrival_time: `${h}:00:00`, departure_time: `${h}:05:00` });
        timings.push({ bus_id: expressBus.id, bus_stop_id: peelameduStop.id, arrival_time: `${h}:15:00`, departure_time: `${h}:17:00` });
        timings.push({ bus_id: expressBus.id, bus_stop_id: kuniyamuthurStop.id, arrival_time: `${h}:25:00`, departure_time: `${h}:30:00` });
      }

      // UCL001 Local — every 30 min
      for (let hour = 6; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const h = String(hour).padStart(2, "0");
          const m = String(minute).padStart(2, "0");
          const nextMin = minute + 5;
          const nextHour = hour + (nextMin >= 60 ? 1 : 0);
          const nh = String(nextHour).padStart(2, "0");
          const nm = String(nextMin % 60).padStart(2, "0");
          timings.push({ bus_id: localBus.id, bus_stop_id: ukkadamStop.id, arrival_time: `${h}:${m}:00`, departure_time: `${nh}:${nm}:00` });
          timings.push({ bus_id: localBus.id, bus_stop_id: kuniyamuthurStop.id, arrival_time: `${nh}:${String((nextMin % 60) + 10).padStart(2, "0")}:00`, departure_time: `${nh}:${String(((nextMin % 60) + 15) % 60).padStart(2, "0")}:00` });
        }
      }
    }

    if (racecourseStop && gandhipuramStop) {
      // KG001 Kuniyamuthur-Gandhipuram — hourly 7am-9pm
      for (let hour = 7; hour <= 21; hour++) {
        const h = String(hour).padStart(2, "0");
        timings.push({ bus_id: kgBus.id, bus_stop_id: kuniyamuthurStop.id, arrival_time: `${h}:00:00`, departure_time: `${h}:05:00` });
        timings.push({ bus_id: kgBus.id, bus_stop_id: racecourseStop.id, arrival_time: `${h}:12:00`, departure_time: `${h}:14:00` });
        timings.push({ bus_id: kgBus.id, bus_stop_id: gandhipuramStop.id, arrival_time: `${h}:22:00`, departure_time: `${h}:27:00` });
      }
    }

    if (mofussilStop) {
      // UM001 Ukkadam-Mofussil — hourly 5am-11pm
      for (let hour = 5; hour <= 23; hour++) {
        const h = String(hour).padStart(2, "0");
        timings.push({ bus_id: umBus.id, bus_stop_id: ukkadamStop.id, arrival_time: `${h}:00:00`, departure_time: `${h}:05:00` });
        timings.push({ bus_id: umBus.id, bus_stop_id: mofussilStop.id, arrival_time: `${h}:30:00`, departure_time: `${h}:35:00` });
      }
    }

    await prisma.busTiming.createMany({ data: timings });
    console.log(`✅ Seeded ${timings.length} bus timings`);

    console.log("\n🎉 Database seeding completed!");
    console.log(`   Bus Stops : ${busStops.length}`);
    console.log(`   Buses     : ${buses.length}`);
    console.log(`   Timings   : ${timings.length}`);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seedDB();
