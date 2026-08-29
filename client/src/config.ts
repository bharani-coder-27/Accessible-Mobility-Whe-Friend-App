const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const apiBaseUrl = configuredApiUrl || "http://10.0.2.2:8801/api";

/**
 * The server root, without the `/api` suffix.
 *
 * Both the REST base and the socket endpoint are derived from one value so a
 * user changing servers cannot end up with the two pointing at different
 * hosts — which would leave the app loading data fine while live conductor
 * updates silently never arrive.
 */
export const defaultServerBase = (
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || apiBaseUrl.replace(/\/api\/?$/, "")
).replace(/\/+$/, "");

export const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
export const hasGoogleMapsApiKey = googleMapsApiKey.length > 0;
export const useMockMaps = process.env.EXPO_PUBLIC_USE_MOCK_MAPS !== "false";
