import axios from "axios";
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { Coordinates } from "../types";

const API_KEY = "AIzaSyB7eC-j0tdLxX6-xAoHApv68JrEXA-j4lo";

export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      { params: { address, key: API_KEY, region: "in" } }
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
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
    {
      params: {
        input,
        key: API_KEY,
        language: "en",
        components: "country:in",
        location: "11.016844,76.955832",
        radius: 50000,
      },
    }
  );
  return response.data.predictions;
};

export const fetchPlaceDetails = async (placeId: string) => {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/place/details/json`,
    { params: { place_id: placeId, key: API_KEY, fields: "geometry" } }
  );
  return response.data.result.geometry.location;
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