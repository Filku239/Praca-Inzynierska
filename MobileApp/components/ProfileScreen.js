import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        // Tu możesz dekodować token JWT jeśli chcesz pobrać np. username/email
        // lub trzymać te dane w AsyncStorage po logowaniu
        const storedUsername = await AsyncStorage.getItem('username');
        const storedEmail = await AsyncStorage.getItem('email');

        if (storedUsername) setUsername(storedUsername);
        if (storedEmail) setEmail(storedEmail);
      } catch (err) {
        console.error('Error loading user data', err);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('email');
    Alert.alert('Wylogowano', 'Zostałeś wylogowany');
    navigation.navigate('Account');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Twoje konto</Text>
      <Text style={styles.label}>Nazwa użytkownika:</Text>
      <Text style={styles.value}>{username || '-'}</Text>
      <Text style={styles.label}>Email:</Text>
      <Text style={styles.value}>{email || '-'}</Text>

      <View style={styles.logoutButton}>
        <Button title="Wyloguj się" color="#FF6600" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6600',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    color: '#333',
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    color: '#555',
  },
  logoutButton: {
    marginTop: 40,
    width: '60%',
  },
});
