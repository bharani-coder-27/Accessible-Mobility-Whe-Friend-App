import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { images } from "../../constants/images";
import { icons } from "../../constants/icons";
import { AuthContext } from '../../src/contexts/AuthContext';

const CondProfile = () => {
  const router = useRouter();

  // States
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+91 9876543210");
  const [dob, setDob] = useState("1999-05-21");
  const [role] = useState("Conductor");
  const [from, setFrom] = useState("Chennai");
  const [to, setTo] = useState("Bangalore");
  const [classOfService, setClassOfService] = useState("Economy");
  const [tripCode, setTripCode] = useState("TRIP12345");

  const [isEditing, setIsEditing] = useState(false);
  const { logout } = useContext(AuthContext);

  

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD
      setDob(formatted);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={logout}>
          <Image source={icons.logout} style={{ height: 25, width: 25}}/>
        </TouchableOpacity>
      </View>

      {/* Profile Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Avatar */}
        <View style={styles.profileHeader}>
          <Image source={images.profile} style={styles.avatar} />
          <TouchableOpacity style={styles.cameraBtn} disabled={!isEditing}>
            <Feather name="camera" size={14} color="white" />
          </TouchableOpacity>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{role}</Text>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setIsEditing((prev) => !prev)}
        >
          <Text style={styles.editText}>
            {isEditing ? "Cancel Edit" : "Edit Profile"}
          </Text>
        </TouchableOpacity>

        {/* Profile Fields */}
        <View style={styles.fieldGroup}>
          <ProfileField
            label="Name"
            value={name}
            onChangeText={setName}
            editable={isEditing}
          />
          <ProfileField
            label="Email"
            value={email}
            onChangeText={setEmail}
            editable={isEditing}
          />
          <ProfileField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            editable={isEditing}
          />

          {/* DOB with Date Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              onPress={() => isEditing && setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <TextInput
                value={dob}
                editable={false}
                style={styles.input}
              />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(dob)}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          <ProfileField
            label="From"
            value={from}
            onChangeText={setFrom}
            editable={isEditing}
          />
          <ProfileField
            label="To"
            value={to}
            onChangeText={setTo}
            editable={isEditing}
          />
          <ProfileField
            label="Class of Service"
            value={classOfService}
            onChangeText={setClassOfService}
            editable={isEditing}
          />
          <ProfileField
            label="Trip Code"
            value={tripCode}
            onChangeText={setTripCode}
            editable={isEditing}
          />
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity onPress={() => router.back()} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CondProfile;

function ProfileField({
  label,
  value,
  onChangeText,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, !editable && { backgroundColor: "#f0f0f0" }]}
        placeholder={`Enter ${label}`}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#624be4ff",
    justifyContent: 'space-between',
    height: 100,
    elevation: 4,
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, color: "#fff", fontWeight: "bold" },

  scrollContainer: { padding: 20 },

  // Profile header
  profileHeader: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  cameraBtn: {
    position: "absolute",
    bottom: 70,
    right: 140,
    backgroundColor: "#38bdf8",
    padding: 8,
    borderRadius: 20,
  },
  name: { marginTop: 12, fontSize: 22, fontWeight: "bold", color: "#111" },
  role: { fontSize: 16, color: "#666" },

  // Edit button
  editBtn: {
    backgroundColor: "#38bdf8",
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  editText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  // Fields
  fieldGroup: { marginTop: 10 },
  fieldContainer: { marginBottom: 16 },
  label: { color: "#555", marginBottom: 6, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },

  // Save button
  saveBtn: {
    backgroundColor: "#624be4ff",
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
