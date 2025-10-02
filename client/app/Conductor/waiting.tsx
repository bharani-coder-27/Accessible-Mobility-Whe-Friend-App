// app/conductor/waiting.tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Header from '../components/Header';
import PassengerList from '../components/PassengerList';

export default function WaitingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <PassengerList status="waiting" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8ff' },
});
