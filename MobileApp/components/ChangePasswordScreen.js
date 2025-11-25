import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://0.0.0.0:3000';

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !repeatPassword) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola.');
      return;
    }
    if (newPassword !== repeatPassword) {
      Alert.alert('Błąd', 'Nowe hasła muszą być takie same.');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('user_id');

    if (!token || !userId) {
      Alert.alert('Błąd', 'Brak autoryzacji. Zaloguj się ponownie.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      if (response.status === 200) {
        Alert.alert('Sukces', 'Hasło zostało zmienione.');
        navigation.goBack();
      } else if (response.status === 400) {
        Alert.alert('Błąd', 'Nieprawidłowe stare hasło.');
      } else {
        Alert.alert('Błąd', `Nie udało się zmienić hasła. Kod: ${response.status}`);
      }

    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nie udało się połączyć z serwerem.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zmień hasło</Text>
      <Text style={styles.subtitle}>Wprowadź swoje obecne hasło i ustaw nowe, aby zwiększyć bezpieczeństwo konta.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Stare hasło</Text>
        <TextInput
          placeholder="Wpisz stare hasło"
          secureTextEntry
          style={styles.input}
          value={oldPassword}
          onChangeText={setOldPassword}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nowe hasło</Text>
        <TextInput
          placeholder="Wpisz nowe hasło"
          secureTextEntry
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Powtórz nowe hasło</Text>
        <TextInput
          placeholder="Powtórz nowe hasło"
          secureTextEntry
          style={styles.input}
          value={repeatPassword}
          onChangeText={setRepeatPassword}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
        <Text style={styles.saveText}>Zmień hasło</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 22,
    backgroundColor: '#fff',
    paddingTop: 70
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25
  },

  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    fontSize: 15
  },

  saveButton: {
    backgroundColor: '#FF6600',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
});
