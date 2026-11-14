import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client/index.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exitCode = 1;
} else {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$queryRaw`SELECT 1`;

    const [users, buses, stops, timings, notifications] = await Promise.all([
      prisma.user.count(),
      prisma.bus.count(),
      prisma.busStop.count(),
      prisma.busTiming.count(),
      prisma.notification.count(),
    ]);

    console.log("Neon connection: OK");
    console.log(
      JSON.stringify(
        { users, buses, busStops: stops, busTimings: timings, notifications },
        null,
        2
      )
    );
  } catch (error) {
    console.error("Neon verification failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
