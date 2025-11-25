import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_BASE_URL = 'http://0.0.0.0:3000';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const storedEmail = await AsyncStorage.getItem('email');
        const storedRole = await AsyncStorage.getItem('role');
        const storedId = await AsyncStorage.getItem('user_id');

        setUsername(storedUsername || '');
        setEmail(storedEmail || '');
        setRole(storedRole || '');
        setUserId(storedId);
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'username', 'email', 'role', 'id']);
      Alert.alert('Wylogowano', 'Zostałeś wylogowany');
      navigation.navigate('Account');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const deleteUserApi = async () => {
    if (!userId) {
      Alert.alert('Błąd', 'Brak ID użytkownika. Nie można usunąć konta.');
      return false;
    }

    const token = await AsyncStorage.getItem('token');
    if (!token) {
        Alert.alert('Błąd', 'Brak tokenu. Wyloguj się i zaloguj ponownie.');
        return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        return true;
      } else if (response.status === 403) {
        Alert.alert('Błąd', 'Brak uprawnień do usunięcia tego konta. Tylko admin lub właściciel konta może to zrobić.');
      } else if (response.status === 404) {
        Alert.alert('Błąd', 'Konto nie zostało znalezione na serwerze.');
      } else {
        Alert.alert('Błąd serwera', `Nie udało się usunąć konta. Status: ${response.status}`);
      }
      return false;

    } catch (error) {
      console.error('Błąd połączenia z API:', error);
      Alert.alert('Błąd połączenia', 'Wystąpił problem z połączeniem z serwerem.');
      return false;
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Potwierdź usunięcie konta',
      'Czy na pewno chcesz trwale usunąć swoje konto? Tej operacji nie można cofnąć.',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Usuń',
          onPress: async () => {
            const success = await deleteUserApi();

            if (success) {
              Alert.alert('Konto usunięte', 'Twoje konto zostało trwale usunięte.');
              handleLogout();
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerCard}>
        <View style={styles.usernameRow}>
          <Text style={styles.username}>{username || 'Twoje imię'}</Text>
          {role ? (
            <View style={[styles.roleBadge, role === 'admin' && styles.adminBadge]}>
              <Text style={styles.roleText}>{role.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.email}>{email || 'Twój email'}</Text>
      </View>

      <TouchableOpacity style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Historia</Text>
          <Text style={styles.sectionDesc}>Twoje ostatnie sprawdzenia pojazdów</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rezerwacje</Text>
          <Text style={styles.sectionDesc}>Twoje aktywne i poprzednie rezerwacje</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionCard} onPress={handleChangePassword}>
          <Text style={styles.sectionTitle}>Zmiana hasła</Text>
          <Text style={styles.sectionDesc}>Zabezpiecz swoje konto nowym hasłem</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.sectionCard, styles.deleteAccountCard]} onPress={handleDeleteAccount}>
          <Text style={[styles.sectionTitle, styles.deleteAccountText]}>Usuń konto</Text>
          <Text style={[styles.sectionDesc, styles.deleteAccountText]}>Trwałe usunięcie wszystkich Twoich danych</Text>
        </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Wyloguj się</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 20,
    paddingTop: 60
  },
  headerCard: {
    backgroundColor: '#FF6600',
    padding: 25,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff'
  },
  roleBadge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#ccc'
  },
  adminBadge: {
    backgroundColor: '#FF3300'
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffe5cc',
    marginTop: 4
  },
  sectionCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  sectionDesc: {
    fontSize: 14,
    color: '#777',
    marginTop: 4
  },
  deleteAccountCard: {
    borderColor: '#FF3300',
    borderWidth: 1,
    backgroundColor: '#fff5f5',
  },
  deleteAccountText: {
    color: '#FF3300',
  },
  logoutButton: {
    backgroundColor: '#FF3300',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
});