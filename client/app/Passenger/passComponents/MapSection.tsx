import React, { useRef } from "react";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { StyleSheet, View } from "react-native";
import { Coordinates, BusStop } from "../../../src/types";

interface Props {
  fromCoords: Coordinates;
  toCoords?: Coordinates | null;
  nearbyStops: BusStop[];
  onStopPress: (stop: BusStop) => void;
  mapWrapperStyle?: object;
  mapStyle?: object;
  userLocation?: Coordinates | null;
  routeCoordinates?: Coordinates[];
}

const MapSection = ({
  fromCoords,
  toCoords,
  nearbyStops,
  onStopPress,
  mapStyle,
  mapWrapperStyle,
  userLocation,
  routeCoordinates = [],
}: Props) => {
  const mapRef = useRef<MapView>(null);

  return (
    <View style={[styles.mapWrapper, mapWrapperStyle]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={[styles.map, mapStyle]}
        initialRegion={{
          latitude: fromCoords.latitude,
          longitude: fromCoords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={!!userLocation}
      >
        <Marker coordinate={fromCoords} title="From Location" pinColor="red" />
        {toCoords && <Marker coordinate={toCoords} title="To Location" pinColor="green" />}
        {userLocation && (
          <Marker coordinate={userLocation} title="Your Location" pinColor="blue" />
        )}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeColor="#0000FF" strokeWidth={3} />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapWrapper: {
    marginVertical: 15,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  map: {
    height: 400,
    width: "100%",
  },
});

export default MapSection;















/* import React, { useRef } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Coordinates, BusStop } from "../../../src/types";
import { StyleSheet, View } from "react-native";

interface Props {
  fromCoords: Coordinates;
  toCoords?: Coordinates | null;
  nearbyStops: BusStop[];
  onStopPress: (stop: BusStop) => void;
  mapWrapperStyle?: object;
  mapStyle?: object;
}

const MapSection = ({
  fromCoords,
  toCoords,
  nearbyStops,
  onStopPress,
  mapStyle,
  mapWrapperStyle
}: Props) => {
  const mapRef = useRef<MapView>(null);

  return (
    <View style={[styles.mapWrapper, mapWrapperStyle]}>
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
      >
        <Marker coordinate={fromCoords} title="From Location" pinColor="red" />
        {toCoords && (
          <Marker coordinate={toCoords} title="To Location" pinColor="green" />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapWrapper: {
    marginVertical: 15,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6, // Android shadow
  },
  map: {
    height: 400,
    width: "100%",
  },
});

export default MapSection; */