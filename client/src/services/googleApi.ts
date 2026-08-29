import axios from "axios";
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { Coordinates } from "../types";
import { googleMapsApiKey, hasGoogleMapsApiKey, useMockMaps } from "../config";

/**
 * Offline stand-in for Google Places and Geocoding.
 *
 * These points match the seeded bus stops (server/prisma/seedData/
 * coimbatore.js) exactly, so with EXPO_PUBLIC_USE_MOCK_MAPS=true the whole
 * passenger flow — search, nearby stops, distances, map — behaves like the
 * real thing without a billed API key.
 */
const mockPlaces = [
  { description: "Ukkadam Bus Stand, Coimbatore", place_id: "mock-ukkadam", coords: { latitude: 10.9895, longitude: 76.9560 } },
  { description: "Gandhipuram Bus Stand, Coimbatore", place_id: "mock-gandhipuram", coords: { latitude: 11.0183, longitude: 76.9725 } },
  { description: "Town Hall, Coimbatore", place_id: "mock-town-hall", coords: { latitude: 10.9973, longitude: 76.9601 } },
  { description: "Race Course, Coimbatore", place_id: "mock-race-course", coords: { latitude: 11.0009, longitude: 76.9707 } },
  { description: "Coimbatore Junction Railway Station", place_id: "mock-junction", coords: { latitude: 10.9962, longitude: 76.9663 } },
  { description: "R.S. Puram, Coimbatore", place_id: "mock-rs-puram", coords: { latitude: 11.0055, longitude: 76.9490 } },
  { description: "Saibaba Colony, Coimbatore", place_id: "mock-saibaba-colony", coords: { latitude: 11.0230, longitude: 76.9450 } },
  { description: "Peelamedu, Coimbatore", place_id: "mock-peelamedu", coords: { latitude: 11.0284, longitude: 77.0006 } },
  { description: "Hopes College, Coimbatore", place_id: "mock-hopes-college", coords: { latitude: 11.0244, longitude: 76.9975 } },
  { description: "PSG College of Technology, Coimbatore", place_id: "mock-psg-tech", coords: { latitude: 11.0243, longitude: 77.0025 } },
  { description: "Singanallur Bus Stand, Coimbatore", place_id: "mock-singanallur", coords: { latitude: 11.0089, longitude: 77.0289 } },
  { description: "Lakshmi Mills Junction, Coimbatore", place_id: "mock-lakshmi-mills", coords: { latitude: 11.0110, longitude: 76.9800 } },
  { description: "Ramanathapuram, Coimbatore", place_id: "mock-ramanathapuram", coords: { latitude: 10.9924, longitude: 76.9862 } },
  { description: "Ganapathy, Coimbatore", place_id: "mock-ganapathy", coords: { latitude: 11.0400, longitude: 76.9860 } },
  { description: "Saravanampatty, Coimbatore", place_id: "mock-saravanampatty", coords: { latitude: 11.0784, longitude: 76.9998 } },
  { description: "Perur, Coimbatore", place_id: "mock-perur", coords: { latitude: 10.9748, longitude: 76.9033 } },
  { description: "Selvapuram, Coimbatore", place_id: "mock-selvapuram", coords: { latitude: 10.9784, longitude: 76.9391 } },
  { description: "Kuniyamuthur, Coimbatore", place_id: "mock-kuniyamuthur", coords: { latitude: 10.9432, longitude: 76.9297 } },
  { description: "Podanur Junction, Coimbatore", place_id: "mock-podanur", coords: { latitude: 10.9525, longitude: 76.9490 } },
  { description: "Sungam, Coimbatore", place_id: "mock-sungam", coords: { latitude: 10.9822, longitude: 76.9628 } },
  { description: "Vadavalli, Coimbatore", place_id: "mock-vadavalli", coords: { latitude: 11.0206, longitude: 76.8980 } },
  { description: "Thudiyalur, Coimbatore", place_id: "mock-thudiyalur", coords: { latitude: 11.0704, longitude: 76.9403 } },
];

/**
 * Resolve a typed address to one of the mock places.
 *
 * Matches on any word the user typed rather than requiring the full label, so
 * "gandhipuram" resolves as readily as "Gandhipuram Bus Stand, Coimbatore".
 * Falls back to the city centre so mock geocoding never returns nothing and
 * strands the flow.
 */
const findMockPlace = (address: string) => {
  const query = address.trim().toLowerCase();
  if (!query) return mockPlaces[0];

  const exact = mockPlaces.find((place) => place.description.toLowerCase() === query);
  if (exact) return exact;

  const partial = mockPlaces.find((place) => place.description.toLowerCase().includes(query));
  if (partial) return partial;

  // Last resort: match on the first meaningful word the user typed.
  const [firstWord] = query.split(/[\s,]+/);
  return (
    mockPlaces.find((place) => place.description.toLowerCase().includes(firstWord)) ?? mockPlaces[0]
  );
};

const getApiKey = () => {
  if (!googleMapsApiKey) {
    throw new Error('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not configured');
  }
  return googleMapsApiKey;
};

export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  if (useMockMaps || !hasGoogleMapsApiKey) return findMockPlace(address).coords;

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      { params: { address, key: getApiKey(), region: "in" } }
    );

    if (response.data.status === "OK") {
      const location = response.data.results[0].geometry.location;
      return { latitude: location.lat, longitude: location.lng };
    }

    console.warn("Geocode failed:", response.data.status);
    return null;
  } catch (error) {
    console.error("Error in geocodeAddress:", error);
    return null;
  }
};

export const fetchPlaceSuggestions = async (input: string) => {
  if (useMockMaps || !hasGoogleMapsApiKey) {
    const query = input.trim().toLowerCase();
    return mockPlaces
      .filter((place) => place.description.toLowerCase().includes(query))
      .map(({ description, place_id }) => ({ description, place_id }));
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
      {
        params: {
          input,
          key: getApiKey(),
          language: "en",
          components: "country:in",
          location: "11.016844,76.955832",
          radius: 50000,
        },
      }
    );
    return response.data.predictions || [];
  } catch (error) {
    console.error("Error fetching place suggestions:", error);
    return [];
  }
};

export const fetchPlaceDetails = async (placeId: string) => {
  if (useMockMaps || !hasGoogleMapsApiKey) {
    return mockPlaces.find((place) => place.place_id === placeId)?.coords ?? null;
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      { params: { place_id: placeId, key: getApiKey(), fields: "geometry" } }
    );
    return response.data.result.geometry.location;
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
};

// Function to get current location and optional reverse geocoded address
export const getCurrentLocation = async (): Promise<{ coords: Coordinates; address?: string } | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Enable location permissions to use this feature.");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    // Optional: Reverse geocode to get readable address
    let address: string | undefined = undefined;
    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geocode.length > 0) {
      const place = geocode[0];
      address = `${place.name || ""} ${place.street || ""}, ${place.city || ""}, ${place.region || ""}`;
    }

    return { coords: { latitude, longitude }, address };
  } catch (error) {
    console.error("Error getting current location:", error);
    Alert.alert("Error", "Could not fetch current location.");
    return null;
  }
};
