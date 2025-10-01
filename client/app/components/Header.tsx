// app/components/Header.tsx
import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants/images';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../../src/contexts/AuthContext';
import { AuthContextType } from '@/src/types';

interface HeaderProps {
  title: string;
}

const { width } = Dimensions.get('window');

export default function Header({ title }: HeaderProps) {
  const { logout, user } = useContext(AuthContext) as AuthContextType;
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const toggleSidebar = () => {
    if (sidebarOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -width * 0.7, duration: 300, useNativeDriver: false }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start(() => setSidebarOpen(false));
    } else {
      setSidebarOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(overlayAnim, { toValue: 0.5, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  };

  const goToProfile = () => router.push('../components/CondProfile');

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={{ padding: 6 }}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', marginLeft: 20 }}>
          <Text style={styles.title}>{title}</Text>
          <Image source={images.logo} style={{ height: 28, width: 28, marginLeft: 10 }} />
        </View>
      </View>

      {/* Sidebar + Overlay */}
      {sidebarOpen && (
        <>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={toggleSidebar} />
          </Animated.View>

          <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
            <View style={{ flexDirection: 'row' }}>
              <Image source={images.profile} style={{ height: 32, width: 32, borderRadius: 10 }} />
              <Text style={styles.userName}>{user?.name || 'Passenger'}</Text>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={goToProfile}>
              <Ionicons name="person-outline" size={20} color="#333" />
              <Text style={styles.menuText}>User Profile</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={styles.menuItem} onPress={logout}>
              <Ionicons name="log-out-outline" size={25} color="red" />
              <Text style={[styles.menuText, { color: 'red' }]}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    // paddingTop: 30,
    zIndex: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    zIndex: 1000,
    elevation: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
    marginLeft: 5,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  menuText: { marginLeft: 10, fontSize: 16, color: '#333' },
  title: { color: '#000', fontSize: 25, fontWeight: 'bold', letterSpacing: 1 },
});
