import React, { useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  BusTiming,
  BusStop,
  Coordinates,
  AuthContextType,
} from "../../src/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import api from "@/src/services/api";
import { AuthContext } from "@/src/contexts/AuthContext";

const BusTimingsList = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { logout, user } = useContext(AuthContext) as AuthContextType;

  const [stop, setStop] = useState<BusTiming | null>(null);

  const selectedStop: BusStop = params.selectedStop
    ? JSON.parse(params.selectedStop as string)
    : null;

  const timings: BusTiming[] = params.timings
    ? JSON.parse(params.timings as string)
    : [];

  const parsedFrom: Coordinates | null = params.fromCoords
    ? JSON.parse(params.fromCoords as string)
    : null;

  const parsedTo: Coordinates | null = params.toCoords
    ? JSON.parse(params.toCoords as string)
    : null;

  const onSelectBus = async (item: BusTiming) => {
    setStop(item);

    const response = async () => {
      return await api.post(`/notify`, {
        bus_id: item.bus_id,
        bus_stop_id: selectedStop?.id,
        user_id: user?.id,
        timing: item.arrival_time,
        message: `Passenger ${user?.name} is waiting at ${selectedStop?.stop_name} for bus ${item.bus_name}`,
      });
    };

    console.log((await response()).data.message);

    router.push({
      pathname: "/Passenger/TrackingScreen",
      params: {
        fromLat: parsedFrom?.latitude ?? "",
        fromLng: parsedFrom?.longitude ?? "",
        destLat: parsedTo?.latitude ?? "",
        destLng: parsedTo?.longitude ?? "",
      },
    });
  };

  if (!selectedStop || timings.length === 0) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Next Buses</Text>
      </View>
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          Next Available Bus Timings for {selectedStop.stop_name}
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingBottom: 20,
            paddingHorizontal: 20,
          }}
        >
          <Text style={{ fontWeight: "bold", fontSize: 20 }}>Buses</Text>
          <Text style={{ fontWeight: "bold", fontSize: 20 }}>Timings</Text>
        </View>
        <FlatList
          data={timings}
          keyExtractor={(item, index) =>
            `${item.bus_id}-${item.arrival_time}-${index}`
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => onSelectBus(item)}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row" }}>
                  <MaterialIcons
                    name="access-time"
                    size={24}
                    color="#624be4ff"
                  />
                  <Text style={styles.listItemText}>
                    {item.bus_name} ({item.trip_code})
                  </Text>
                </View>
                <View>
                  <Text style={{ color: "#e44b4bff" }}>
                    {item.arrival_time}
                  </Text>
                </View>
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
    paddingBottom: 200,
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
  listContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2c3e50",
    paddingBottom: 15,
  },
  listItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    elevation: 3,
    paddingVertical: 20,
  },
  listItemText: {
    fontSize: 16,
    color: "#34495e",
    marginLeft: 5,
  },
});

export default BusTimingsList;
