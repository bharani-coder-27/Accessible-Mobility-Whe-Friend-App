import { Tabs } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import { PassengerProvider } from '../../src/contexts/PassengerContext';
import Header from '../components/Header';
import { Image } from 'react-native';
import { icons } from '../../constants/icons';
import Toast from 'react-native-toast-message';

export default function ConductorTabsLayout() {

  return (
    <PassengerProvider>
      {/* ✅ Header is now global (outside Tabs) */}
      <Header title="Dashboard" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
          tabBarActiveTintColor: '#624be4ff',
          tabBarInactiveTintColor: '#444444ff',
          tabBarStyle: {
            height: 90,
            paddingTop: 10,
            borderTopWidth: 2,
            borderTopColor: '#ccc',
            elevation: 5,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
          },
        }}
      >
        <Tabs.Screen
          name="waiting"
          options={{
            title: 'Waiting',
            tabBarIcon: ({ color, size }) => (
              <Image source={icons.waiting} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />
            ),
          }}
        />
        <Tabs.Screen
          name="traveling"
          options={{
            title: 'Traveling',
            tabBarIcon: ({ color, size }) => (
              <Image source={icons.traveling} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />
            ),
          }}
        />
        <Tabs.Screen
          name="completed"
          options={{
            title: 'Completed',
            tabBarIcon: ({ color, size }) => (
              <Image source={icons.completed} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />
            ),
          }}
        />
      </Tabs>

      {/* Important — toast container must be inside the render tree */}
      <Toast />
    </PassengerProvider>
  );
}
