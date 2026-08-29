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

Create `server/.env` with a PostgreSQL connection string:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/msme_db
PORT=8801
JWT_SECRET=replace-this-in-development
NODE_ENV=development
```

Generate the Prisma client and apply migrations:

```powershell
npm run db:generate
npm run db:migrate -- --name init
```

Seed sample bus stops, buses, and timings when needed:

```powershell
npm run db:seed
```

Start the backend:

```powershell
npm run dev
# or
npm start
```

The API listens on `http://localhost:8801` by default.

## Database Commands

```powershell
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Create and apply a development migration
npm run db:push      # Synchronize schema without creating a migration
npm run db:seed      # Insert sample PostgreSQL data
npm run db:studio    # Open Prisma Studio
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
