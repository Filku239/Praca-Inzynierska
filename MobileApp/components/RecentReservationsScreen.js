import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { API_BASE_URL, COLORS } from './constants/Config';

const ReservationItem = ({ reservation, onCancel }) => {
  const { _id, vehicle, startDate, endDate, cost } = reservation;

  const vehicleName = `${vehicle?.make || 'Nieznana'} ${vehicle?.model || 'Marka'}`;

  const isPast = new Date(endDate) < new Date();
  const isCancellable = !isPast;
  const status = isPast ? 'Zakończona' : 'Aktywna';

  const handleCancel = () => {
    Alert.alert(
      'Potwierdź anulowanie',
      `Czy na pewno chcesz anulować rezerwację pojazdu ${vehicleName} na okres ${startDate} do ${endDate}?`,
      [
        { text: 'Nie', style: 'cancel' },
        { text: 'Tak, anuluj', style: 'destructive', onPress: () => onCancel(_id) },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.itemContainer}>
      <View style={styles.detailsRow}>
        <Text style={styles.vehicleName}>{vehicleName}</Text>
        <Text style={[styles.statusText, { color: isPast ? COLORS.textLight : COLORS.primary }]}>
          {status}
        </Text>
      </View>

      <Text style={styles.dateText}>Od: {startDate}</Text>
      <Text style={styles.dateText}>Do: {endDate}</Text>

      <View style={styles.costRow}>
        <Text style={styles.costLabel}>Koszt:</Text>
        <Text style={styles.costValue}>{cost} PLN</Text>
      </View>

      {isCancellable && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Anuluj rezerwację</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};


export default function RecentReservationsScreen({ navigation }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservations = useCallback(async (authToken) => {
      if (!authToken) {
        setError("Użytkownik nie jest zalogowany.");
        setLoading(false);
        return;
      }

      const userId = await AsyncStorage.getItem('user_id');

      if (!userId) {
        setError("Nie znaleziono ID użytkownika. Proszę zaloguj się ponownie.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_BASE_URL}/reservations/user/${userId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        setReservations(response.data.reverse());
      } catch (err) {
        console.error("Błąd pobierania rezerwacji:", err);
        if (err.response && err.response.status === 401) {
          Alert.alert('Sesja wygasła', 'Proszę zaloguj się ponownie.');
          navigation.navigate('Account');
        }
        setError("Nie udało się pobrać historii rezerwacji.");
      } finally {
        setLoading(false);
      }
    }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const loadTokenAndData = async () => {
        const t = await AsyncStorage.getItem('token');
        fetchReservations(t);
      };
      loadTokenAndData();
      return () => {
      };
    }, [fetchReservations])
  );

  const handleCancelReservation = async (reservationId) => {
    const currentToken = await AsyncStorage.getItem('token');

    if (!currentToken) {
      Alert.alert('Błąd', 'Brak tokena autoryzacji. Proszę zaloguj się ponownie.');
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/reservations/${reservationId}`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      setReservations(prev => prev.filter(res => res._id !== reservationId));

      Alert.alert('Sukces', 'Rezerwacja została anulowana.');
    } catch (err) {
      setLoading(false);
      const status = err.response ? err.response.status : 'Brak odpowiedzi';
      console.error("Błąd anulowania rezerwacji:", err.response ? err.response.data : err.message);

      let message = 'Nie udało się anulować rezerwacji. Spróbuj ponownie.';
      if (status === 403) {
          message = 'Nie masz uprawnień, aby anulować tę rezerwację.';
      } else if (status === 404) {
          message = 'Rezerwacja nie została znaleziona.';
      } else if (status === 401) {
          message = 'Sesja wygasła. Proszę zaloguj się ponownie.';
      }

      Alert.alert('Błąd', message);
    }
  };


  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={{ marginTop: 10 }}>Ładowanie rezerwacji...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchReservations(token)}>
            <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (reservations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>Brak dokonanych rezerwacji.</Text>
        <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('Home')}
        >
            <Text style={styles.retryButtonText}>Przeglądaj pojazdy</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={reservations}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <ReservationItem reservation={item} onCancel={handleCancelReservation} />
      )}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  listContainer: { padding: 16, backgroundColor: COLORS.background },

  itemContainer: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  costLabel: {
    fontSize: 14,
    color: COLORS.textDark,
    marginRight: 5,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },

  cancelButton: {
    marginTop: 15,
    backgroundColor: COLORS.red || '#DC3545',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  noDataText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.red || '#DC3545',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  }
});