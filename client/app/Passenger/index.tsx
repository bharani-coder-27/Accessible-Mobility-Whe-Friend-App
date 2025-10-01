import React, { useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { AuthContext } from "../../src/contexts/AuthContext";
import {
  Coordinates,
  BusStop,
  AuthContextType,
} from "../../src/types";
import LocationInput from "./passComponents/LocationInput";
import MapSection from "./passComponents/MapSection";
import LoadingOverlay from "./passComponents/LoadingOverlay";
import api from "../../src/services/api";
import {
  geocodeAddress,
  fetchPlaceSuggestions,
  getCurrentLocation,
} from "../../src/services/googleApi";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../constants/images";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

export default function PassengerHomeScreen() {
  const { logout, user } = useContext(AuthContext) as AuthContextType;

  const [fromAddress, setFromAddress] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [fromCoords, setFromCoords] = useState<Coordinates | null>(null);
  const [toCoords, setToCoords] = useState<Coordinates | null>(null);
  const [nearbyStops, setNearbyStops] = useState<BusStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPressed, setIsPressed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // ----------------- Handlers -----------------
  const handleUseCurrentLocation = async () => {
    const result = await getCurrentLocation();
    if (!result) return;
    setFromCoords(result.coords);
    if (result.address) setFromAddress(result.address);
  };

  const handleFromInputChange = async (text: string) => {
    setFromAddress(text);
    if (text.length === 0) return setFromSuggestions([]);
    const suggestions = await fetchPlaceSuggestions(text);
    setFromSuggestions(suggestions);
  };

  const handleToInputChange = async (text: string) => {
    setToAddress(text);
    if (text.length === 0) return setToSuggestions([]);
    const suggestions = await fetchPlaceSuggestions(text);
    setToSuggestions(suggestions);
  };

  const findNearbyStops = async () => {
    if (!fromCoords) {
      Alert.alert(
        "Error",
        "Please enter 'From' address or use current location."
      );
      return;
    }

    if (!toCoords) {
      Alert.alert("Error", "Please enter 'To' address.");
      return;
    }

    setLoading(true);
    try {
      let { latitude: lat, longitude: lng } = fromCoords;

      if (fromAddress && !fromCoords) {
        const geoData = await geocodeAddress(fromAddress);
        if (geoData) {
          lat = geoData.latitude;
          lng = geoData.longitude;
          setFromCoords(geoData);
        }
      }

      if (toAddress && !toCoords) {
        const geoData = await geocodeAddress(toAddress);
        if (geoData) setToCoords(geoData);
      }

      const response = await api.get("/buses/bus_stops", {
        params: {
          latitude: lat,
          longitude: lng,
          radius: 5000,
          city: "Coimbatore",
        },
      });
      setNearbyStops(response.data || []);
      router.push({
        pathname: "/Passenger/NearbyStopsModal",
        params: {
          fromAddress,
          stops: JSON.stringify(response.data || []),
          fromCoords: JSON.stringify(fromCoords),
          toCoords: JSON.stringify(toCoords),
        },
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not fetch nearby bus stops.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    if (sidebarOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.7,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => setSidebarOpen(false));
    } else {
      setSidebarOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  // ----------------- Render -----------------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={{ padding: 6 }}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", marginLeft: 20 }}>
          <Text style={styles.title}>Whe Friend</Text>
          <Image
            source={images.logo}
            style={{ height: 28, width: 28, marginLeft: 10 }}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ padding: 20, paddingTop: 30 }}>
          {/* From Input */}
          <LocationInput
            value={fromAddress}
            onChange={handleFromInputChange}
            suggestions={fromSuggestions}
            placeholder="From Address"
            onSelect={(coords, desc) => {
              setFromCoords(coords);
              setFromAddress(desc);
              setFromSuggestions([]);
            }}
            useCurrentLocation={handleUseCurrentLocation}
            zIndex={20} // keep default
            box={false}
          />

          {/* To Input */}
          <LocationInput
            value={toAddress}
            onChange={handleToInputChange}
            suggestions={toSuggestions}
            placeholder="To Address"
            onSelect={(coords, desc) => {
              setToCoords(coords);
              setToAddress(desc);
              setToSuggestions([]);
            }}
            zIndex={10} // keep default
            box={true}
          />

          {/* Find Stops Button */}
          <TouchableOpacity
            style={[styles.button, isPressed && styles.buttonPressed]}
            onPress={findNearbyStops}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            activeOpacity={0.9}
          >
            <Text style={styles.text}>Find Nearby Bus Stops</Text>
          </TouchableOpacity>

          {/* Map Section */}
          {fromCoords && (
            <MapSection
              fromCoords={fromCoords}
              toCoords={toCoords}
              nearbyStops={nearbyStops}
              onStopPress={(stop) => setSelectedStop(stop)}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar + Overlay */}
      {sidebarOpen && (
        <>
          {/* Background overlay */}
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={toggleSidebar} />
          </Animated.View>

          {/* Sidebar */}
          <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
            <View style={{ flexDirection: 'row'}}>
              <Image
                source={images.profile}
                style={{ height: 32, width: 32, borderRadius: 10 }}
              />
              <Text style={styles.userName}>{user?.name || "Passenger"}</Text>
            </View>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="person-outline" size={20} color="#333" />

              <Text style={styles.menuText}>User Profile</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={styles.menuItem} onPress={logout}>
              <Ionicons name="log-out-outline" size={25} color="red" />
              <Text style={[styles.menuText, { color: "red" }]}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      <LoadingOverlay visible={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    paddingTop: 30,
  },
  title: {
    color: "#000",
    fontSize: 25,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    zIndex: 100, // above inputs
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    zIndex: 101, // above overlay
    elevation: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#624be4ff",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 15,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  buttonPressed: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  text: {
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
});
