import React from 'react';
import PassengerList from '../components/PassengerList';
import { View } from 'react-native';

export default function CompletedScreen() {
  return (
    <View style={{ backgroundColor: '#f8f8f8ff', flex: 1 }}>
        <PassengerList status="completed" />
    </View>
  );
}