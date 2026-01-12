import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { API_BASE_URL, COLORS } from './constants/Config';

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState({});
  const navigation = useNavigation();

  const loadReservationsForVehicle = async (vehicleId) => {
    try {
      setLoadingReservations(prev => ({ ...prev, [vehicleId]: true }));
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/vehicles/${vehicleId}/reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
       console.log('res (PEŁNY):', res);
      setVehicles(prev =>
        prev.map(v =>
          v._id === vehicleId ? { ...v, reservations: res.data } : v
        )
      );
    } catch (err) {
      console.error('Błąd pobierania rezerwacji:', err.response?.data || err.message);
      Alert.alert('Błąd', 'Nie udało się pobrać rezerwacji.');
    } finally {
      setLoadingReservations(prev => ({ ...prev, [vehicleId]: false }));
    }
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('user_id');
      const token = await AsyncStorage.getItem('token');
      if (!userId || !token) return;

      const res = await axios.get(`${API_BASE_URL}/vehicles/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Pełna odpowiedź API:', res);
      setVehicles(res.data || []);
      (res.data || []).forEach(vehicle => loadReservationsForVehicle(vehicle._id));
    } catch (err) {
      console.error('Błąd pobierania pojazdów:', err.response?.data || err.message);
      Alert.alert('Błąd', 'Nie udało się pobrać Twoich pojazdów.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [])
  );

  const handleDeleteVehicle = async (vehicleId) => {
    Alert.alert(
      'Potwierdź usunięcie pojazdu',
      'Czy na pewno chcesz usunąć ten pojazd? Tej operacji nie można cofnąć.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_BASE_URL}/vehicles/${vehicleId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setVehicles(prev => prev.filter(v => v._id !== vehicleId));
              Alert.alert('Usunięto', 'Pojazd został usunięty.');
            } catch (err) {
              console.error('Błąd usuwania pojazdu:', err.response?.data || err.message);
              Alert.alert('Błąd', 'Nie udało się usunąć pojazdu.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleDeleteReservation = async (vehicleId, reservationId) => {
      console.log('reservationId RAW:', JSON.stringify(reservationId));
    Alert.alert(
      'Potwierdź usunięcie rezerwacji',
      'Czy na pewno chcesz usunąć tę rezerwację?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_BASE_URL}/reservations/${reservationId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setVehicles(prev =>
                prev.map(v =>
                  v._id === vehicleId
                    ? { ...v, reservations: v.reservations.filter(r => r._id !== reservationId) }
                    : v
                )
              );
              Alert.alert('Usunięto', 'Rezerwacja została usunięta.');
            } catch (err) {
              console.error('Błąd usuwania rezerwacji:', err.response?.data || err.message);
              Alert.alert('Błąd', 'Nie udało się usunąć rezerwacji.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text>Ładowanie pojazdów...</Text>
      </View>
    );
  }

  if (!vehicles.length) {
    return (
      <View style={styles.center}>
        <Text>Nie masz jeszcze żadnych pojazdów.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {vehicles.map(vehicle => (
        <View key={vehicle._id} style={styles.card}>
          <View style={styles.imageContainer}>
            {vehicle.image ? (
              <Image
                source={{ uri: vehicle.image }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>Brak zdjęcia</Text>
              </View>
            )}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
            <Text style={styles.small}>Rok: {vehicle.year}</Text>
            <Text style={styles.small}>Cena: {vehicle.rentalPricePerDay} PLN/dzień</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.detailButton}
                onPress={() => navigation.navigate('EditVehicle', { vehicleId: vehicle._id })}
              >
                <Text style={styles.buttonText}>Edytuj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteVehicle(vehicle._id)}
              >
                <Text style={styles.buttonText}>Usuń</Text>
              </TouchableOpacity>
            </View>
            {loadingReservations[vehicle._id] && (
              <ActivityIndicator size="small" color={COLORS.secondary} style={{ marginTop: 5 }} />
            )}
            {vehicle.reservations && vehicle.reservations.map((res, index) => (
              <View key={index} style={styles.reservationCard}>
                <Text>
                  <Text style={{ fontWeight: '700' }}>Od: </Text>{res.startDate} <Text style={{ fontWeight: '700' }}>Do: </Text>{res.endDate}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteReservation(vehicle._id, res._id)}
                  style={styles.deleteButtonSmall}
                >
                  <Text style={styles.buttonText}>Usuń rezerwację</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: COLORS.background
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 15,
    elevation: 3,
    overflow: 'hidden'
  },
  image: {
    width: 110,
    height: 90
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border
  },
  placeholderText: {
    color: COLORS.textLight
  },
  cardBody: {
    flex: 1,
    padding: 10
  },
  vehicleName: {
    fontWeight: '700',
    color: COLORS.textDark,
    fontSize: 16
  },
  small: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10
  },
  detailButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 8,
    marginRight: 5,
    alignItems: 'center'
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    padding: 8,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: 'center'
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700'
  },
  reservationCard: {
    backgroundColor: COLORS.border,
    padding: 8,
    borderRadius: 8,
    marginTop: 5
  },
  deleteButtonSmall: {
    backgroundColor: COLORS.secondary,
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
    alignItems: 'center'
  }
});