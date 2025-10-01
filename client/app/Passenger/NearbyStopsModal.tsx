import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { BusStop } from "../../src/types";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../../src/services/api";

const NearbyStopsModal = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const stops: BusStop[] = JSON.parse((params.stops as string) || "[]");
  const fromAddress: string = (params.fromAddress as string) || "";

  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);

  const handleNextScreen = async (item: BusStop) => {
    setSelectedStop(item);

    const response = await api.get(`/buses/bus_timings`, {
      params: {
        stop_id: item.id,
        current_time: new Date().toISOString(),
      },
    });

    router.push({
      pathname: "/Passenger/BusTimingsList",
      params: {
        timings: JSON.stringify(response.data), // always stringify
        selectedStop: JSON.stringify(item),     // use item directly
        fromCoords: params.fromCoords as string,
        toCoords: params.toCoords as string,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bus Stops</Text>
      </View>

      {/* Stops List */}
      <View style={styles.modalContainer}>
        <Text style={styles.listTitle}>
          Bus Stops Near {fromAddress || "Your Location"}
        </Text>
        <FlatList
          data={stops}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => handleNextScreen(item)}
            >
              <View style={{ flexDirection: "row" }}>
                <MaterialIcons
                  name="location-pin"
                  size={24}
                  color="#624be4ff"
                />
                <Text style={styles.listItemText}>
                  {item.stop_name}
                  {item.distance ? ` - ${item.distance.toFixed(2)} km` : ""}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    marginLeft: 10,
  },
  modalContainer: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: "#fff",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#2c3e50",
  },
  listItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    elevation: 3,
  },
  listItemText: {
    fontSize: 16,
    color: "#34495e",
    marginLeft: 5,
  },
});

export default NearbyStopsModal;
