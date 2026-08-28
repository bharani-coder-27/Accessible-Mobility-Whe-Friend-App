import axios from "axios";
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { Coordinates } from "../types";
import { googleMapsApiKey, hasGoogleMapsApiKey, useMockMaps } from "../config";

const mockPlaces = [
  { description: "Ukkadam Bus Stand, Coimbatore", place_id: "mock-ukkadam", coords: { latitude: 10.9629, longitude: 76.9402 } },
  { description: "Kuniyamuthur Main Junction, Coimbatore", place_id: "mock-kuniyamuthur", coords: { latitude: 10.9579, longitude: 76.9541 } },
  { description: "Gandhipuram Bus Stand, Coimbatore", place_id: "mock-gandhipuram", coords: { latitude: 11.0076, longitude: 76.9611 } },
  { description: "Peelamedu Market, Coimbatore", place_id: "mock-peelamedu", coords: { latitude: 10.9809, longitude: 76.9537 } },
  { description: "Race Course, Coimbatore", place_id: "mock-race-course", coords: { latitude: 10.9876, longitude: 76.9624 } },
];

const findMockPlace = (address: string) => {
  const normalizedAddress = address.toLowerCase();
  return mockPlaces.find((place) => normalizedAddress.includes(place.description.split(",")[0].toLowerCase())) || mockPlaces[0];
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
      //console.log(location.lat, location.lng);
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
    const normalizedInput = input.toLowerCase();
    return mockPlaces
      .filter((place) => place.description.toLowerCase().includes(normalizedInput))
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
  if (!hasGoogleMapsApiKey) return null;

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