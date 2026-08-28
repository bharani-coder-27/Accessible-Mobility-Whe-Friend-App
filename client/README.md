# Whe Friend Mobile App

Expo SDK 54 React Native client for the wheelchair-accessible bus booking system.

## Android Run

Start PostgreSQL and the backend first, then configure the client:

```powershell
cd client
Copy-Item .env.example .env
```

The default backend URL is `http://10.0.2.2:8801/api`, which is the Android Emulator address for the host machine. For a physical device, set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` in `.env` to the computer's LAN address.

Build and install the native development app:

```powershell
npm install
npx expo run:android
```

The native Firebase file is `android/app/google-services.json`. It must belong to the Firebase Android app whose package is `com.anonymous.client`.

## Google Services

Set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env` before rebuilding Android. The key must have billing enabled and access to:

- Maps SDK for Android
- Maps SDK for iOS, if building iOS
- Geocoding API
- Places API
- Directions API

Restrict the key by Android package/SHA-1 for native Maps and restrict web service usage appropriately. The old key was removed from source and cannot be assumed valid because it is several months old. A new key is not required to compile the app, but Maps, address search, and route directions will not work without one.

## Checks

```powershell
npx tsc --noEmit
npm run lint
npx expo config --type public
```

The lint command currently reports only hook dependency warnings in tracking and conductor socket effects.
