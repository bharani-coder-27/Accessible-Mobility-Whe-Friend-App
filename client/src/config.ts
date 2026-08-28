const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const apiBaseUrl = configuredApiUrl || "http://10.0.2.2:8801/api";
export const socketUrl =
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || apiBaseUrl.replace(/\/api\/?$/, "");
export const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";