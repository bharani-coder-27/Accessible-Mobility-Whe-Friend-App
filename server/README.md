# Wheelchair Service Backend

Node.js and Express backend for the wheelchair-accessible bus booking system. PostgreSQL is accessed through Prisma 7 with the PostgreSQL driver adapter.

## Requirements

- Node.js 18 or newer
- PostgreSQL
- A database named `msme_db` (or another database in `DATABASE_URL`)

## Setup

```powershell
cd server
npm install
```

Create `server/.env` with the Neon connection strings:

```env
DATABASE_URL=postgresql://user:password@direct-host/db?sslmode=require
DATABASE_URL_POOLED=postgresql://user:password@pooled-host/db?sslmode=require
PORT=8801
JWT_SECRET=replace-this-in-development
NODE_ENV=development
```

For Neon, put the direct/unpooled connection in `DATABASE_URL`. Use the pooled
connection in `DATABASE_URL_POOLED` for the API. Do not commit `.env`.

Generate the Prisma client, apply the committed migrations, seed the sample
data, and verify the hosted database:

```powershell
cd server
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run db:verify
```

`db:seed` clears existing users, buses, stops, timings, and notifications before
inserting the demo data. Run it only against a fresh or intentionally reset
database.

## Deploy on Render

This repository includes [`render.yaml`](../render.yaml). In Render, choose
**New → Blueprint**, select the repository, and apply the blueprint. Add these
secret environment variables when prompted:

- `DATABASE_URL`: the direct Neon connection string
- `DATABASE_URL_POOLED`: the pooled Neon connection string
- `JWT_SECRET`: a new long random production secret

Render runs `npm ci` from `server`, applies committed Prisma migrations before
each start, and checks `GET /health`. Do not add `npm run db:seed` to the Render
start command because the seed intentionally deletes production data.

After the first deploy, verify:

```powershell
curl https://<your-render-service>.onrender.com/health
```

Then set the mobile app's server base/API URL to the Render service URL (the app
automatically appends `/api` for API calls). Socket connections use the same
base URL.

Start the backend:

```powershell
npm run dev
# or
npm start
```

The API listens on `http://localhost:8801` by default.

## Database Commands

```powershell
npm run db:generate       # Generate Prisma client
npm run db:migrate        # Create and apply a development migration
npm run db:migrate:deploy # Apply committed migrations in a hosted database
npm run db:push           # Synchronize schema without creating a migration
npm run db:seed           # Insert sample PostgreSQL data
npm run db:verify         # Test the connection and print row counts
npm run db:studio         # Open Prisma Studio
```

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/buses/bus_stops`
- `GET /api/buses/bus_timings`
- `POST /api/notify`
- `GET /api/notify/conductor/:bus_id`
- `PUT /api/notify/markseen`
- `POST /api/notify/savePushToken`
- `POST /api/notify/startTravel`
- `POST /api/notify/confirmTravel`
- `POST /api/notify/completeTravel`

The Prisma schema is in `prisma/schema.prisma`; its migration history is in `prisma/migrations`.
