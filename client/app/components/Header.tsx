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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { images } from '@/constants/images';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../../src/contexts/AuthContext';
import { AuthContextType } from '@/src/types';

const { width } = Dimensions.get('window');

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { logout, user } = useContext(AuthContext) as AuthContextType;
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

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

  const goToProfile = () => router.push('../components/CondProfile');

  return (
    <>
      {/* Header bar (always visible) */}
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={{ padding: 6 }}>
            <Ionicons name="menu" size={28} color="#000" />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', marginLeft: 20 }}>
            <Text style={styles.title}>{title}</Text>
            <Image source={images.logo} style={{ height: 28, width: 28, marginLeft: 10 }} />
          </View>
        </View>
      </SafeAreaView>

      {/* Sidebar + Overlay (float above everything) */}
      {sidebarOpen && (
        <>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={toggleSidebar} />
          </Animated.View>

          <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
            <View style={styles.profileRow}>
              <Image source={images.profile} style={styles.profileIcon} />
              <Text style={styles.userName}>{user?.name || 'Conductor'}</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  safeHeader: {
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 10,
  },
  header: {
    height: 70,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomColor: '#eee',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    zIndex: 2000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    zIndex: 3000,
    elevation: 30,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  profileIcon: { height: 40, width: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontSize: 20, fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  menuText: { marginLeft: 10, fontSize: 16, color: '#333' },
  title: { color: '#000', fontSize: 25, fontWeight: 'bold', letterSpacing: 1 },
});
