import React from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { PlaceSuggestion, Coordinates } from "../../../src/types";
import { MaterialIcons } from "@expo/vector-icons";
import { geocodeAddress } from "../../../src/services/googleApi"; // adjust path

interface Props {
  value: string;
  onChange: (text: string) => void;
  suggestions: PlaceSuggestion[];
  onSelect: (coords: Coordinates, description: string) => void;
  placeholder: string;
  useCurrentLocation?: () => void; // optional
  zIndex?: number; // optional to handle layering
  box: boolean;
}

const LocationInput = ({
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder,
  useCurrentLocation,
  zIndex = 10,
  box
}: Props) => {
  const handleSelect = async (description: string) => {
    try {
      const coords = await geocodeAddress(description);
      if (coords) {
        onSelect(coords, description);
      } else {
        console.warn("No coordinates found for:", description);
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
  };
  return (
    <View style={{ marginBottom: 18, zIndex }}>
      <View style={styles.inputContainer}>
        {!box ?
          <MaterialIcons name="search" size={24} color="#624be4ff" />   // water drop
          : <MaterialIcons name="location-pin" size={24} color="#624be4ff" /> // drop-shaped location pin
        }
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          placeholderTextColor="#000"
          onChangeText={onChange}
          autoCapitalize="words"
        />
        {useCurrentLocation && (
          <TouchableOpacity onPress={useCurrentLocation} style={styles.locationBtn}>
            <MaterialIcons name="my-location" size={20} color="#624be4ff" />
          </TouchableOpacity>
        )}
      </View>

      {value.trim().length > 0 && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => handleSelect(item.description)}
            >
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
          style={styles.suggestionList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ccd1d9",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  locationBtn: {
    marginLeft: 8,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ecf0f1",
  },
  suggestionList: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 20,
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccd1d9",
  },
});

export default LocationInput;
