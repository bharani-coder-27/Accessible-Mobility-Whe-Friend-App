import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../src/contexts/AuthContext";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import api from '../../src/services/api';

export default function RegisterScreen() {
  const { login } = useContext(AuthContext);
  const router = useRouter();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("passenger");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tripCode, setTripCode] = useState("");
  const [classOfService, setClassOfService] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Add state and handler
  const [showDatePicker, setShowDatePicker] = useState(false);
  const onDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date | undefined
  ): void => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setDob(selectedDate.toISOString().split('T')[0]);
    }
  };

  const buttonScale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleRegister = async () => {
    if (!name || !email || !phoneNumber || !password || !confirmPassword || !dob) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (role === "conductor" && (!from || !to || !tripCode || !classOfService || !deviceId)) {
      Alert.alert("Error", "Please fill in all conductor fields (From, To, Trip Code, Class of Service, Device ID)");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob)) {
      Alert.alert("Error", "Please enter date of birth in YYYY-MM-DD format");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (role === "conductor" && !/^[A-Za-z0-9]+$/.test(deviceId)) {
      Alert.alert("Error", "Device ID must be alphanumeric");
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        phone_number: phoneNumber,
        dob,
        password,
        role,
        is_active: 1,
        ...(role === "conductor" && {
          from,
          to,
          tripCode,
          classOfService,
          deviceId,
        }),
      });
      console.log("Registration response:", response.data);

      Alert.alert("Success", "Registration successful! Login to continue.");
      router.push("/Auth/LoginScreen");
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "Registration failed. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        <FontAwesome name="user-plus" size={28} color="#2c3e50" /> Create an Account
      </Text>

      <Text style={styles.roleLabel}>Select Your Role</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === "passenger" && styles.roleButtonSelected]}
          onPress={() => setRole("passenger")}
        >
          <Text style={[styles.roleButtonText, role === "passenger" && styles.roleButtonTextSelected]}>
            Passenger
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === "conductor" && styles.roleButtonSelected]}
          onPress={() => setRole("conductor")}
        >
          <Text style={[styles.roleButtonText, role === "conductor" && styles.roleButtonTextSelected]}>
            Conductor
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number (10 digits)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputContainer}>
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Date of Birth (YYYY-MM-DD)"
          value={dob}
          editable={false}
        />
        <FontAwesome name="calendar" size={20} color="#2c3e50" style={styles.icon} />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={dob ? new Date(dob) : new Date()}
          mode="date"
          onChange={onDateChange}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.icon}>
          <FontAwesome name={showPassword ? "eye" : "eye-slash"} size={20} color="#2c3e50" />
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.icon}>
          <FontAwesome name={showConfirmPassword ? "eye" : "eye-slash"} size={20} color="#2c3e50" />
        </TouchableOpacity>
      </View>
      {role === "conductor" && (
        <>
          <Text style={styles.label}>Conductor Details</Text>
          <TextInput
            style={styles.input}
            placeholder="From (e.g., Madukkarai)"
            value={from}
            onChangeText={setFrom}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="To (e.g., Saibaba Colony)"
            value={to}
            onChangeText={setTo}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Trip Code (e.g., 3B)"
            value={tripCode}
            onChangeText={setTripCode}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Class of Service (e.g., Low Floor Bus)"
            value={classOfService}
            onChangeText={setClassOfService}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Device ID (e.g., MGR976883094)"
            value={deviceId}
            onChangeText={setDeviceId}
            autoCapitalize="none"
          />
        </>
      )}

      <TouchableOpacity
        onPressIn={handleButtonPressIn}
        onPressOut={handleButtonPressOut}
        onPress={handleRegister}
      >
        <Animated.View style={[styles.registerButton, animatedButtonStyle]}>
          <LinearGradient colors={["#2ecc71", "#27ae60"]} style={styles.gradientButton}>
            <Text style={styles.buttonText}>Register</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Auth/LoginScreen")}>
        <Text style={styles.loginLink}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f0f4f8",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccd1d9",
    padding: 15,
    marginVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccd1d9",
    borderRadius: 12,
    marginVertical: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWithIcon: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  icon: {
    padding: 10,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 10,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccd1d9",
    backgroundColor: "#fff",
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  roleButtonSelected: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  roleButtonText: {
    fontSize: 14,
    color: "#34495e",
    fontWeight: "500",
  },
  roleButtonTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  registerButton: {
    borderRadius: 12,
    marginVertical: 20,
    overflow: "hidden",
  },
  gradientButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loginLink: {
    color: "#3498db",
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
    marginBottom: 20,
  },
});