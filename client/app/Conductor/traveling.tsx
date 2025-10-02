import React from 'react';
import PassengerList from '../components/PassengerList';
import Header from '../components/Header';
import { View } from 'react-native'; 

export default function TravelingScreen() {
  return (
    <View style={{ backgroundColor: '#f8f8f8ff', flex: 1 }}>
      <PassengerList status="traveling" />
    </View>
  );
}
