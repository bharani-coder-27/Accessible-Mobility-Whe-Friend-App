import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../src/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import api from '../../src/services/api';

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Animation for buttons
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });
      console.log("Login response:", response.data);
      const { user, token } = response.data;
      await login(user, token);
      if (user.role === "conductor") {
        router.push("/Conductor/ConductorHomeScreen");
      } else {
        router.push("/Passenger/PassengerHomeScreen");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <FontAwesome name="sign-in" size={28} color="#2c3e50" /> Welcome Back
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        onPressIn={handleButtonPressIn}
        onPressOut={handleButtonPressOut}
        onPress={handleLogin}
      >
        <Animated.View style={[styles.loginButton, animatedButtonStyle]}>
          <LinearGradient colors={["#3498db", "#2980b9"]} style={styles.gradientButton}>
            <Text style={styles.buttonText}>Login</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Auth/RegisterScreen")}>
        <Text style={styles.registerLink}>Don&apos;t have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f4f8",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 30,
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
  loginButton: {
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
  registerLink: {
    color: "#2ecc71",
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});