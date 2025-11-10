import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddVehicleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ekran dodawania pojazdu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9'
  },
  text: {
    fontSize: 18,
    color: '#333'
  }
});
