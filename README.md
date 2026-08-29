# ♿ Whe Friend — Wheelchair-Friendly Bus Travel

An accessible mobile app that helps wheelchair users travel independently on
public buses, and helps conductors know who needs assistance before the bus
reaches the stop.

**Passenger:** plan a journey → pick a nearby accessible stop → pick a bus →
tell the conductor you are waiting → track the ride until you arrive.

**Conductor:** see waiting passengers arrive in real time, start their journey,
and mark them as arrived — each step notifies the passenger.

---

## 🛠️ Tech stack

| Layer | Stack |
| --- | --- |
| Mobile app | React Native (Expo SDK 54), TypeScript, Expo Router |
| Backend | Node.js, Express 5, Socket.IO |
| Database | PostgreSQL via Prisma |
| Realtime | Socket.IO (conductor dashboard) |
| Push | Expo Notifications |
| Maps | react-native-maps + Google Maps / Places / Directions |

---

## 📂 Project structure

```
Wheel_Chair_Project/
├── client/                     # Expo app
│   ├── app/                    # Routes only — every file here is a URL
│   │   ├── _layout.tsx         # Providers, fonts, splash, root navigation
│   │   ├── index.tsx           # Entry redirect
│   │   ├── profile.tsx         # Shared profile editor
│   │   ├── settings.tsx        # Appearance, text size, contrast, language
│   │   ├── Auth/               # Sign in, sign up
│   │   ├── Passenger/          # Tabs: plan, trips, account (+ booking flow)
│   │   └── Conductor/          # Tabs: waiting, on board, completed, account
│   ├── src/
│   │   ├── theme/              # Design tokens + ThemeProvider
│   │   ├── components/ui/      # Design-system primitives
│   │   ├── components/         # Shared feature components
│   │   ├── contexts/           # Auth, Language, Passenger
│   │   ├── services/           # API client, Google Maps helpers
│   │   ├── hooks/              # useHaptics, useDebouncedValue
│   │   ├── utils/              # Storage, validation, notifications
│   │   └── i18n.ts             # English / Tamil / Hindi catalogue
│   └── constants/              # Image and icon references
├── server/
│   ├── server.js               # Entry point
│   ├── prisma/                 # Schema, migrations, seed
│   └── src/
│       ├── routes/             # auth, buses, notify
│       ├── controllers/        # Request handling
│       ├── models/             # Prisma data access
│       ├── services/           # Expo push delivery
│       └── middleWare/         # JWT guard, error handler
└── DataBase/                   # Legacy SQL reference dumps
```

> Anything placed under `client/app/` becomes a navigable route. Shared
> components belong in `client/src/components/`.

---

## ⚙️ Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # set DATABASE_URL and JWT_SECRET
npm run db:migrate          # apply migrations
npm run db:seed             # optional: sample stops, buses and timings
npm run dev
```

### 2. Mobile app

```bash
cd client
npm install
cp .env.example .env        # set the API URL and (optionally) a Maps key
npx expo start
```

The Android emulator reaches your host machine on `10.0.2.2`. On a physical
device, use your machine's LAN IP instead.

### Client environment variables

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | REST base URL, e.g. `http://10.0.2.2:8801/api` |
| `EXPO_PUBLIC_SOCKET_URL` | Socket.IO URL, e.g. `http://10.0.2.2:8801` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Enables real maps, geocoding and routing |
| `EXPO_PUBLIC_USE_MOCK_MAPS` | `true` uses built-in sample places, no billing |

Without a Maps key the app runs on mock place data and shows an explanatory
placeholder where the map would be, so the whole flow stays testable.

---

## ♿ Accessibility

Accessibility is the product here, not a checklist item.

- **Screen reader support throughout.** Every control has a role, a name and a
  state. Composite rows are read as one item, so "Route 12B, arrives 9:05 am,
  wheelchair accessible" is a single sentence rather than three fragments.
- **48pt minimum touch targets** everywhere — the larger of the WCAG 2.5.5 and
  Material minimums.
- **In-app text size** (default / large / extra large), layered on top of the OS
  font setting, for users who cannot navigate system settings.
- **High-contrast mode** with solid borders replacing shadows, since a blurred
  shadow is not a reliable boundary cue for low-vision users.
- **Light, dark and system themes**, all AA-compliant.
- **Reduce-motion aware** — animations and screen transitions back off when the
  OS asks them to.
- **Never colour alone.** Status always pairs a colour with an icon and a label.
- **Live announcements** for validation errors and journey arrival.
- **Three languages** — English, Tamil and Hindi — covering every screen, not
  just the login page. The language picker sits on the sign-in screen, before
  authentication, so a rider can switch before reading the form.
- **Haptic feedback** confirming presses for users who cannot easily verify the
  screen changed.

---

## 🔌 API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account; returns a session |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Read own profile *(auth)* |
| `PUT` | `/api/auth/me` | Update own profile *(auth)* |
| `GET` | `/api/buses/bus_stops` | Stops near a coordinate |
| `GET` | `/api/buses/bus_timings` | Upcoming buses at a stop |
| `POST` | `/api/notify` | Tell a conductor you are waiting |
| `GET` | `/api/notify/history` | Own trip history *(auth)* |
| `GET` | `/api/notify/conductor/:bus_id` | Passengers for a bus |
| `PUT` | `/api/notify/markseen` | Advance a passenger's status |
| `POST` | `/api/notify/startTravel` | Notify passenger the bus is coming |
| `POST` | `/api/notify/confirmTravel` | Passenger confirms boarding |
| `POST` | `/api/notify/completeTravel` | Notify passenger the trip is done |
| `POST` | `/api/notify/savePushToken` | Register an Expo push token |

Socket.IO: clients emit `joinBusRoom` with a `bus_id`; the server emits
`receiveNotification` to that room when a passenger books.

---

## 🧪 Checks

```bash
cd client
npx tsc --noEmit      # type check
npx eslint .          # lint
```

---

## 📜 License

MIT.
