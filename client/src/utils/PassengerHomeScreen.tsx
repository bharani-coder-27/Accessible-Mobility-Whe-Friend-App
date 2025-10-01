import React, { useContext, useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, ScrollView } from "react-native";
import { AuthContext } from "../../src/contexts/AuthContext";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { router } from "expo-router";
import api from '../../src/services/api'; // Assuming this is your axios instance for the backend
//import { ScrollView } from "react-native-reanimated/lib/typescript/Animated";

// Define the data types for your components, adjusted to match your backend JSON
interface BusStop {
  id: string; // The ID from your database
  stop_name: string;
  latitude: number;
  longitude: number;
  distance: number; // In kilometers
}

interface BusTiming {
  bus_id: string; // The ID of the bus from your backend
  bus_name: string;
  arrival_time: string;
  trip_code: string;
  wheelchair_accessible: number;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

interface AuthUser {
  id: string;
  name?: string;
}

interface AuthContextType {
  logout: () => void;
  user: AuthUser | null;
}

// Your Google Maps API key
const API_KEY = "GOOGLE_MAPS_API_KEY";

export default function PassengerHomeScreen() {
  const { logout, user } = useContext(AuthContext) as AuthContextType;
  const [fromAddress, setFromAddress] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [fromCoords, setFromCoords] = useState<Coordinates | null>(null);
  const [toCoords, setToCoords] = useState<Coordinates | null>(null);
  const [nearbyStops, setNearbyStops] = useState<BusStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [busTimings, setBusTimings] = useState<BusTiming[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);


  // Dynamic zoom to show all markers
  useEffect(() => {
    if (mapRef.current && fromCoords) {
      const coordinates = [
        fromCoords,
        ...(toCoords ? [toCoords] : []),
        ...nearbyStops.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude })),
      ];
      if (coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } else if (fromCoords) {
        mapRef.current.animateToRegion({
          latitude: fromCoords.latitude,
          longitude: fromCoords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    }
  }, [fromCoords, toCoords, nearbyStops]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to get your current location.");
        setLoading(false);
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      const coords: Coordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setFromCoords(coords);

      const addressArray = await Location.reverseGeocodeAsync(coords);
      if (addressArray.length > 0) {
        const address = addressArray[0];
        setFromAddress(
          `${address.name || ""}${address.city ? `, ${address.city}` : ""}${address.region ? `, ${address.region}` : ""}${address.country ? `, ${address.country}` : ""}`.trim()
        );
      } else {
        setFromAddress("Unknown Location");
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setFromAddress("Unknown Location");
      Alert.alert("Error", "Failed to get current location.");
    } finally {
      setLoading(false);
    }
  };

  const findNearbyStops = async () => {
    setLoading(true);
    let lat: number, lng: number;

    if (fromAddress) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json`,
          {
            params: {
              address: `${fromAddress}`,
              key: API_KEY,
              region: "in",
            },
          }
        );
        if (response.data.status === "OK" && response.data.results.length > 0) {
          lat = response.data.results[0].geometry.location.lat;
          lng = response.data.results[0].geometry.location.lng;
          setFromCoords({ latitude: lat, longitude: lng });
        } else {
          Alert.alert("Invalid Address", "Could not find location for 'From' address. Try adding 'Coimbatore, Tamil Nadu'.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("From geocoding error:", err);
        Alert.alert("Geocoding Error", "Failed to geocode 'From' address.");
        setLoading(false);
        return;
      }
    } else if (fromCoords) {
      lat = fromCoords.latitude;
      lng = fromCoords.longitude;
    } else {
      Alert.alert("No From Location", "Please enter a 'From' address or use your current location.");
      setLoading(false);
      return;
    }

    if (toAddress) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json`,
          {
            params: {
              address: `${toAddress}`,
              key: API_KEY,
              region: "in",
            },
          }
        );
        if (response.data.status === "OK" && response.data.results.length > 0) {
          setToCoords({
            latitude: response.data.results[0].geometry.location.lat,
            longitude: response.data.results[0].geometry.location.lng,
          });
        } else {
          Alert.alert("Invalid Address", "Could not find location for 'To' address. Try adding 'Coimbatore, Tamil Nadu'.");
        }
      } catch (err) {
        console.error("To geocoding error:", err);
        Alert.alert("Geocoding Error", "Failed to geocode 'To' address.");
      }
    }

    // Call your backend API to get nearby stops
    try {
      const response = await api.get('/buses/bus_stops', {
        params: {
          latitude: lat,
          longitude: lng,
          radius: 5000, // in meters
          city: 'Coimbatore' // Example city, adjust as needed
        }
      });
      
      const stops: BusStop[] = response.data;
      setNearbyStops(stops);
      setModalVisible(true);
    } catch (err) {
      console.error("Backend API error:", err);
      Alert.alert("Error", "Could not load nearby bus stops from server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBusTimings = async (stopId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/buses/bus_timings`, {
        params: {
          stop_id: stopId, // This should be a dynamic value based on the selected stop name
          current_time: new Date().toISOString(),
        },
      });

      if (response.status === 200) {
        const timings: BusTiming[] = response.data;
        if (timings.length > 0) {
          setBusTimings(timings);
        } else {
          Alert.alert("No Timings", "No bus timings found for this stop.");
          setBusTimings([]);
        }
      } else {
        console.error("Backend API error:", response.status);
        Alert.alert("Error", "Could not load bus timings from backend.");
        setBusTimings([]);
      }
    } catch (err) {
      console.error("Backend API error:", err);
      Alert.alert("Error", "Could not load bus timings.");
      setBusTimings([]);
    } finally {
      setLoading(false);
    }
  };

  const chooseBus = async (busId: string, stopId: string, arrivalTime: string) => {
    if (!user?.id) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }
    if (!selectedStop) {
      Alert.alert("Error", "No bus stop selected.");
      return;
    }
    if (isNaN(selectedStop.latitude) || isNaN(selectedStop.longitude)) {
      Alert.alert("Error", "Invalid bus stop coordinates.");
      return;
    }
    if (!fromCoords) {
      Alert.alert("Error", "No starting location selected.");
      return;
    }

    try {
      const message = `Passenger ${user.name || "Unknown"} booked for ${selectedStop.stop_name}`;

      await api.post('/notify', {
        user_id: user.id,
        bus_id: busId,
        bus_stop_id: stopId,
        timing: arrivalTime,
        message: message,
      });

      Alert.alert("Success", "Notification sent to conductor");

      router.push({
        pathname: "/Passenger/TrackingScreen",
        params: {
          destLat: selectedStop.latitude.toString(),
          destLng: selectedStop.longitude.toString(),
          fromLat: fromCoords.latitude.toString(),
          fromLng: fromCoords.longitude.toString(),
        },
      });
    } catch (err: any) {
      console.error("Notify error:", err);
      Alert.alert("Error", "Could not send notification");
    }
  };

  const fetchSuggestions = async (input: string, type: "from" | "to") => {
    if (input.length < 2) {
      if (type === "from") setFromSuggestions([]);
      else setToSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: `${input}`,
            key: API_KEY,
            language: "en",
            components: "country:in",
            location: "11.016844,76.955832",
            radius: 50000,
          },
        }
      );
      if (response.data.status === "OK") {
        const suggestions: PlaceSuggestion[] = response.data.predictions.map((pred: any) => ({
          description: pred.description,
          place_id: pred.place_id,
        }));
        if (type === "from") setFromSuggestions(suggestions);
        else setToSuggestions(suggestions);
      } else {
        console.error("Places API error:", response.data.status);
        if (type === "from") setFromSuggestions([]);
        else setToSuggestions([]);
      }
    } catch (error) {
      console.error("Suggestions fetch error:", error);
      if (type === "from") setFromSuggestions([]);
      else setToSuggestions([]);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView} 
      contentContainerStyle={styles.contentContainer}
    >
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
      <Text style={styles.welcome}>Welcome, {user && user.name ? user.name : "Passenger"}!</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="From Address"
          value={fromAddress}
          onChangeText={(text) => {
            setFromAddress(text);
            fetchSuggestions(text, "from");
          }}
          autoCapitalize="words"
        />
        {fromSuggestions.length > 0 && (
          <FlatList
            data={fromSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={async () => {
                  setFromAddress(item.description);
                  setFromSuggestions([]);
                  try {
                    const response = await axios.get(
                      `https://maps.googleapis.com/maps/api/place/details/json`,
                      {
                        params: {
                          place_id: item.place_id,
                          key: API_KEY,
                          fields: "geometry",
                        },
                      }
                    );
                    if (response.data.status === "OK") {
                      setFromCoords({
                        latitude: response.data.result.geometry.location.lat,
                        longitude: response.data.result.geometry.location.lng,
                      });
                    } else {
                      Alert.alert("Error", "Could not fetch coordinates for selected address");
                    }
                  } catch (error) {
                    console.error("Place details error:", error);
                    Alert.alert("Error", "Could not fetch coordinates for selected address");
                  }
                }}
              >
                <Text style={styles.listItemText}>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionList}
          />
        )}
        <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>Use Current Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="To (e.g., Ukkadam, Coimbatore)"
          value={toAddress}
          onChangeText={(text) => {
            setToAddress(text);
            fetchSuggestions(text, "to");
          }}
          autoCapitalize="words"
        />
        {toSuggestions.length > 0 && (
          <FlatList
            data={toSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={async () => {
                  setToAddress(item.description);
                  setToSuggestions([]);
                  try {
                    const response = await axios.get(
                      `https://maps.googleapis.com/maps/api/place/details/json`,
                      {
                        params: {
                          place_id: item.place_id,
                          key: API_KEY,
                          fields: "geometry",
                        },
                      }
                    );
                    if (response.data.status === "OK") {
                      setToCoords({
                        latitude: response.data.result.geometry.location.lat,
                        longitude: response.data.result.geometry.location.lng,
                      });
                    } else {
                      Alert.alert("Error", "Could not fetch coordinates for selected address");
                    }
                  } catch (error) {
                    console.error("Place details error:", error);
                    Alert.alert("Error", "Could not fetch coordinates for selected address");
                  }
                }}
              >
                <Text style={styles.listItemText}>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionList}
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.findButton} onPress={findNearbyStops} disabled={loading}>
          <Text style={styles.buttonText}>Find Nearby Bus Stops</Text>
        </TouchableOpacity>
      </View>

      {fromCoords && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: fromCoords.latitude,
            longitude: fromCoords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          minZoomLevel={8}
          maxZoomLevel={18}
        >
          <Marker coordinate={fromCoords} title="From Location" pinColor="red" />
          {toCoords && <Marker coordinate={toCoords} title="To Location" pinColor="green" />}
          {nearbyStops.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.stop_name}
              description={stop.distance ? `${stop.distance.toFixed(2)} km away` : ""}
              pinColor="blue"
              onPress={() => {
                setSelectedStop(stop);
                /* if (fromCoords) {
                  fetchBusTimings(stop.id);
                } */
              }}
            />
          ))}
        </MapView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Text style={styles.listTitle}>Bus Stops Near {fromAddress || "Your Location"}</Text>
          <FlatList
            data={nearbyStops}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  setSelectedStop(item);
                  /* if (fromCoords) {
                    
                  } */
                  fetchBusTimings(item.id);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.listItemText}>
                  {item.stop_name} {item.distance ? `- ${item.distance.toFixed(2)} km` : ""}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {selectedStop && (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Bus Timings for {selectedStop.stop_name}</Text>
          <FlatList
            data={busTimings}
            keyExtractor={(item, index) => `${item.bus_id}-${item.arrival_time}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => chooseBus(item.bus_id, selectedStop.id, item.arrival_time)}
              >
                <Text style={styles.listItemText}>
                  {item.bus_name} ({item.trip_code}) - {item.arrival_time}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  welcome: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 15,
    color: "#2c3e50",
  },
  inputContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    marginBottom: 18,
    zIndex: 2,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccd1d9",
    padding: 18,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  currentLocationButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
    zIndex: 1,
  },
  findButton: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#e74c3c",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  map: {
    flex: 1,
    marginVertical: 15,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 0,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  listContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2c3e50",
  },
  listItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listItemText: {
    fontSize: 16,
    color: "#34495e",
  },
  suggestionList: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 3,
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccd1d9",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007bff',
  },
  scrollView: {
    // This is the most crucial style for a ScrollView.
    // It makes the component take up all available space.
    flex: 1, 
    // You can also add a background color for a consistent look.
    backgroundColor: '#f0f4f8',
  },
  contentContainer: {
    // Use this to add padding around all content inside the ScrollView.
    paddingHorizontal: 20,
    paddingVertical: 10,
    // Add flexGrow: 1 if you want the content to stretch and fill the space
    // when there isn't enough content to scroll.
    flexGrow: 1,
  },
});




/* import React, { useContext, useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, TextInput, Modal } from "react-native";
import { AuthContext } from "../../src/contexts/AuthContext";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { router } from "expo-router";

interface BusStop {
  id: string; // Google Places place_id
  name: string;
  latitude: number;
  longitude: number;
  distance?: number; // In kilometers
}

interface BusTiming {
  bus_id: string; // Transit line name or short_name
  bus_name: string;
  arrival_time: string;
  route_number: string;
  wheelchair_accessible: number; // Default to 0 as Google API may not provide
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

interface AuthUser {
  id: string;
  name?: string;
}

interface AuthContextType {
  logout: () => void;
  user: AuthUser | null;
}

export default function PassengerHomeScreen() {
  const { logout, user } = useContext(AuthContext) as AuthContextType;
  const [fromAddress, setFromAddress] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [fromCoords, setFromCoords] = useState<Coordinates | null>(null);
  const [toCoords, setToCoords] = useState<Coordinates | null>(null);
  const [nearbyStops, setNearbyStops] = useState<BusStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [busTimings, setBusTimings] = useState<BusTiming[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const mapRef = useRef<MapView>(null);

  const API_KEY = "AIzaSyB7eC-j0tdLxX6-xAoHApv68JrEXA-j4lo"; // Your Google Maps API key

  // Dynamic zoom to show all markers
  useEffect(() => {
    if (mapRef.current && fromCoords) {
      const coordinates = [
        fromCoords,
        ...(toCoords ? [toCoords] : []),
        ...nearbyStops.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude })),
      ];
      if (coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } else if (fromCoords) {
        mapRef.current.animateToRegion({
          latitude: fromCoords.latitude,
          longitude: fromCoords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    }
  }, [fromCoords, toCoords, nearbyStops]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required");
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      const coords: Coordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setFromCoords(coords);

      const addressArray = await Location.reverseGeocodeAsync(coords);
      if (addressArray.length > 0) {
        const address = addressArray[0];
        setFromAddress(
          `${address.name || ""}${address.city ? `, ${address.city}` : ""}${
            address.region ? `, ${address.region}` : ""
          }${address.country ? `, ${address.country}` : ""}`.trim()
        );
      } else {
        setFromAddress("Unknown Location");
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setFromAddress("Unknown Location");
    }
  };

  const findNearbyStops = async () => {
    let lat: number, lng: number;

    if (fromAddress) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json`,
          {
            params: {
              address: `${fromAddress}`,
              key: API_KEY,
              region: "in",
            },
          }
        );
        if (response.data.status === "OK" && response.data.results.length > 0) {
          lat = response.data.results[0].geometry.location.lat;
          lng = response.data.results[0].geometry.location.lng;
          setFromCoords({ latitude: lat, longitude: lng });
        } else {
          Alert.alert(
            "Invalid Address",
            "Could not find location for from address. Try adding 'Coimbatore, Tamil Nadu'."
          );
          return;
        }
      } catch (err) {
        console.error("From geocoding error:", err);
        Alert.alert("Geocoding Error", "Failed to geocode from address.");
        return;
      }
    } else if (fromCoords) {
      lat = fromCoords.latitude;
      lng = fromCoords.longitude;
    } else {
      Alert.alert("No From Location", "Please enter a from address or use current location.");
      return;
    }

    if (toAddress) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json`,
          {
            params: {
              address: `${toAddress}`,
              key: API_KEY,
              region: "in",
            },
          }
        );
        if (response.data.status === "OK" && response.data.results.length > 0) {
          setToCoords({
            latitude: response.data.results[0].geometry.location.lat,
            longitude: response.data.results[0].geometry.location.lng,
          });
        } else {
          Alert.alert(
            "Invalid Address",
            "Could not find location for to address. Try adding 'Coimbatore, Tamil Nadu'."
          );
        }
      } catch (err) {
        console.error("To geocoding error:", err);
        Alert.alert("Geocoding Error", "Failed to geocode to address.");
      }
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${lat},${lng}`,
            radius: 5000,
            type: "bus_station",
            key: API_KEY,
          },
        }
      );
      if (response.data.status === "OK") {
        const stops: BusStop[] = response.data.results.map((place: any) => ({
          id: place.place_id,
          name: place.name,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          distance: place.vicinity ? undefined : undefined,
        }));
        setNearbyStops(stops);
        setModalVisible(true);
      } else {
        console.error("Places API error:", response.data.status);
        Alert.alert("Error", "Could not load nearby bus stops");
      }
    } catch (err) {
      console.error("Places API error:", err);
      Alert.alert("Error", "Could not load nearby bus stops");
    }
  };

  const fetchBusTimings = async (stopId: string) => {
    if (!stopId) {
      Alert.alert("Error", "Invalid bus stop selected");
      return;
    }
    if (!fromCoords || !toCoords) {
      Alert.alert("Error", "Please ensure both from and to locations are set");
      return;
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${fromCoords.latitude},${fromCoords.longitude}`,
            destination: `${toCoords.latitude},${toCoords.longitude}`,
            mode: "transit",
            transit_mode: "bus",
            key: API_KEY,
            region: "in",
            departure_time: Math.floor(Date.now() / 1000),
          },
        }
      );
      if (response.data.status === "OK" && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const legs = route.legs[0];
        const timings: BusTiming[] = [];

        legs.steps.forEach((step: any) => {
          if (step.travel_mode === "TRANSIT" && step.transit_details) {
            console.log("Transit Stop:", step.transit_details.arrival_stop);
            const arrivalStop = step.transit_details.arrival_stop;
            if (
              arrivalStop.place_id === stopId ||
              (selectedStop && arrivalStop.name.includes(selectedStop.name))
            ) {
              timings.push({
                bus_id: step.transit_details.line.short_name || step.transit_details.line.name,
                bus_name: step.transit_details.line.name || "Unknown Bus",
                arrival_time: step.transit_details.arrival_time.text,
                route_number: step.transit_details.line.short_name || "N/A",
                wheelchair_accessible: 0, // Default to 0, no filtering
              });
            }
          }
        });

        if (timings.length > 0) {
          setBusTimings(timings);
        } else {
          Alert.alert("No Timings", "No bus timings found for this stop");
          setBusTimings([]);
        }
      } else {
        console.error("Directions API error:", response.data.status);
        Alert.alert("Error", "Could not load bus timings");
        setBusTimings([]);
      }
    } catch (err) {
      console.error("Directions API error:", err);
      Alert.alert("Error", "Could not load bus timings");
      setBusTimings([]);
    }
  };

  const chooseBus = async (busId: string, stopId: string, arrivalTime: string) => {
    if (!user?.id) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }
    if (!selectedStop) {
      Alert.alert("Error", "No bus stop selected.");
      return;
    }
    if (isNaN(selectedStop.latitude) || isNaN(selectedStop.longitude)) {
      Alert.alert("Error", "Invalid bus stop coordinates.");
      return;
    }
    if (!fromCoords) {
      Alert.alert("Error", "No starting location selected.");
      return;
    }

    try {
      const message = `Passenger ${user.name || "Unknown"} booked for ${selectedStop.name}`;
      console.log("Simulated notification:", {
        bus_id: busId,
        bus_stop_id: stopId,
        user_id: user.id,
        timing: arrivalTime,
        message,
      });

      Alert.alert("Success", "Notification sent to conductor");

      router.push({
        pathname: "/Passenger/TrackingScreen",
        params: {
          destLat: selectedStop.latitude.toString(),
          destLng: selectedStop.longitude.toString(),
          fromLat: fromCoords.latitude.toString(),
          fromLng: fromCoords.longitude.toString(),
        },
      });
    } catch (err: any) {
      console.error("Notify error:", err);
      Alert.alert("Error", "Could not send notification");
    }
  };

  const fetchSuggestions = async (input: string, type: "from" | "to") => {
    if (input.length < 2) {
      if (type === "from") {
        setFromSuggestions([]);
      } else {
        setToSuggestions([]);
      }
      return;
    }
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: `${input}`,
            key: API_KEY,
            language: "en",
            components: "country:in",
            location: "11.016844,76.955832",
            radius: 50000,
          },
        }
      );
      if (response.data.status === "OK") {
        const suggestions: PlaceSuggestion[] = response.data.predictions.map((pred: any) => ({
          description: pred.description,
          place_id: pred.place_id,
        }));
        if (type === "from") {
          setFromSuggestions(suggestions);
        } else {
          setToSuggestions(suggestions);
        }
      } else {
        console.error("Places API error:", response.data.status);
        if (type === "from") {
          setFromSuggestions([]);
        } else {
          setToSuggestions([]);
        }
      }
    } catch (error) {
      console.error("Suggestions fetch error:", error);
      if (type === "from") {
        setFromSuggestions([]);
      } else {
        setToSuggestions([]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Welcome, {user && user.name ? user.name : "Passenger"}!
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="From Address"
          value={fromAddress}
          onChangeText={(text) => {
            setFromAddress(text);
            fetchSuggestions(text, "from");
          }}
          autoCapitalize="words"
        />
        {fromSuggestions.length > 0 && (
          <FlatList
            data={fromSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={async () => {
                  setFromAddress(item.description);
                  setFromSuggestions([]);
                  try {
                    const response = await axios.get(
                      `https://maps.googleapis.com/maps/api/place/details/json`,
                      {
                        params: {
                          place_id: item.place_id,
                          key: API_KEY,
                          fields: "geometry",
                        },
                      }
                    );
                    if (response.data.status === "OK") {
                      setFromCoords({
                        latitude: response.data.result.geometry.location.lat,
                        longitude: response.data.result.geometry.location.lng,
                      });
                    } else {
                      Alert.alert("Error", "Could not fetch coordinates for selected address");
                    }
                  } catch (error) {
                    console.error("Place details error:", error);
                    Alert.alert("Error", "Could not fetch coordinates for selected address");
                  }
                }}
              >
                <Text style={styles.listItemText}>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionList}
          />
        )}
        <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>Use Current Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="To (e.g., Ukkadam, Coimbatore)"
          value={toAddress}
          onChangeText={(text) => {
            setToAddress(text);
            fetchSuggestions(text, "to");
          }}
          autoCapitalize="words"
        />
        {toSuggestions.length > 0 && (
          <FlatList
            data={toSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={async () => {
                  setToAddress(item.description);
                  setToSuggestions([]);
                  try {
                    const response = await axios.get(
                      `https://maps.googleapis.com/maps/api/place/details/json`,
                      {
                        params: {
                          place_id: item.place_id,
                          key: API_KEY,
                          fields: "geometry",
                        },
                      }
                    );
                    if (response.data.status === "OK") {
                      setToCoords({
                        latitude: response.data.result.geometry.location.lat,
                        longitude: response.data.result.geometry.location.lng,
                      });
                    } else {
                      Alert.alert("Error", "Could not fetch coordinates for selected address");
                    }
                  } catch (error) {
                    console.error("Place details error:", error);
                    Alert.alert("Error", "Could not fetch coordinates for selected address");
                  }
                }}
              >
                <Text style={styles.listItemText}>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionList}
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.findButton} onPress={findNearbyStops}>
          <Text style={styles.buttonText}>Find Nearby Bus Stops</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={() => {
          if (mapRef.current && fromCoords) {
            mapRef.current.animateToRegion({
              latitude: fromCoords.latitude,
              longitude: fromCoords.longitude,
              latitudeDelta: 0.2,
              longitudeDelta: 0.2,
            });
          }
        }}>
          <Text style={styles.buttonText}>Zoom Out</Text>
        </TouchableOpacity>
      </View>

      {fromCoords && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: fromCoords.latitude,
            longitude: fromCoords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          minZoomLevel={8}
          maxZoomLevel={18}
          onRegionChangeComplete={(region: Region) => {
            console.log("Map region changed:", region);
          }}
        >
          <Marker coordinate={fromCoords} title="From Location" pinColor="red" />
          {toCoords && <Marker coordinate={toCoords} title="To Location" pinColor="green" />}
          {nearbyStops.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.name}
              description={stop.distance ? `Distance: ${stop.distance.toFixed(2)} km` : ""}
              pinColor="blue"
              onPress={() => {
                setSelectedStop(stop);
                fetchBusTimings(stop.id);
              }}
            />
          ))}
        </MapView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Text style={styles.listTitle}>
            Bus Stops Near {fromAddress || "Your Location"}
            {toAddress ? ` to ${toAddress}` : ""}
          </Text>
          <FlatList
            data={nearbyStops}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  setSelectedStop(item);
                  fetchBusTimings(item.id);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.listItemText}>
                  {item.name} {item.distance ? `- ${item.distance.toFixed(2)} km` : ""}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {selectedStop && (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Bus Timings for {selectedStop.name}</Text>
          <FlatList
            data={busTimings}
            keyExtractor={(item, index) => `${item.bus_id}-${item.arrival_time}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => chooseBus(item.bus_id, selectedStop.id, item.arrival_time)}
              >
                <Text style={styles.listItemText}>
                  {item.bus_name} ({item.route_number}) - {item.arrival_time}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  welcome: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 15,
    color: "#2c3e50",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccd1d9",
    padding: 18,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  currentLocationButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    zIndex: 1,
  },
  findButton: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    marginRight: 5,
  },
  zoomButton: {
    backgroundColor: "#f1c40f",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: "#e74c3c",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  map: {
    flex: 1,
    marginVertical: 15,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 0,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  listContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2c3e50",
  },
  listItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listItemText: {
    fontSize: 16,
    color: "#34495e",
  },
  suggestionList: {
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 2,
  },
}); */
