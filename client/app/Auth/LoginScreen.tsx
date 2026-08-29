import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../src/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import api from '../../src/services/api';
import { useLanguage } from "../../src/contexts/LanguageContext";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const { language, setLanguage, t } = useLanguage();
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
      Alert.alert("Error", `${t("email")} and ${t("password")} are required`);
      return;
    }

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });
      console.log("Login response:", response.data);
      const { user, token } = response.data;
      
      if (!user || !token) {
        Alert.alert("Error", "Invalid response from server");
        return;
      }

      await login(user, token);
      // Navigation will be handled automatically by the AuthContext routing
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}><FontAwesome name="sign-in" size={28} color="#2c3e50" /> {t("signInTitle")}</Text>
      <View style={styles.languageRow}>
        {(["en", "ta", "hi"] as const).map((item) => (
          <TouchableOpacity key={item} onPress={() => setLanguage(item)} style={[styles.language, language === item && styles.languageActive]}>
            <Text style={styles.languageText}>{item.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder={t("email")}
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#000"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder={t("password")}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#000"
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
            <Text style={styles.buttonText}>{t("login")}</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Auth/RegisterScreen")}>
        <Text style={styles.registerLink}>{t("noAccount")}</Text>
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
  languageRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 12 },
  language: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#e5e7eb" },
  languageActive: { backgroundColor: "#3498db" },
  languageText: { fontSize: 12, fontWeight: "700", color: "#243447" },
});