import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function AccountScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true = login, false = register
  const navigation = useNavigation();

  const handleAuth = async () => {
    setLoading(true);
    const url = isLogin ? 'http://0.0.0.0:3000/users/login' : 'http://0.0.0.0:3000/users/register';
    const payload = isLogin ? { email, password } : { username, email, password };

    try {
      const response = await axios.post(url, payload);

      if (isLogin) {
        const token = response.data.token;
        await AsyncStorage.setItem('token', token);
        Alert.alert('Sukces', 'Zalogowano pomyślnie!');
        navigation.navigate('Vehicles');
      } else {
        Alert.alert('Sukces', 'Zarejestrowano pomyślnie! Teraz się zaloguj.');
        setIsLogin(true);
        setUsername('');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error('Auth error:', err);
      const msg = err.response?.data?.message || 'Wystąpił błąd';
      Alert.alert('Błąd', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Logowanie' : 'Rejestracja'}</Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Nazwa użytkownika"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Hasło"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? 'Zaloguj się' : 'Zarejestruj się'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6600',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#FF6600',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '100%',
    backgroundColor: '#FF6600',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchText: {
    color: '#FF6600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
