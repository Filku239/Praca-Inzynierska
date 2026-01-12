import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { API_BASE_URL, COLORS, screenWidth } from './constants/Config';
import {
  parseISODate,
  getDatesBetween,
  rangeCollidesWithReserved,
  buildSelectedDatesMap
} from './utils/DateUtils';

const ColorLegend = () => (
  <View style={styles.legendContainer}>
    <View style={styles.legendItem}>
      <View style={[styles.legendColorBox, { backgroundColor: COLORS.primary }]} />
      <Text style={styles.legendText}>Wybrany okres</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendColorBox, { backgroundColor: COLORS.secondary }]} />
      <Text style={styles.legendText}>Zarezerwowane</Text>
    </View>
  </View>
);

export default function SingleVehicleScreen({ route, navigation }) {
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reservedDatesMap, setReservedDatesMap] = useState({});
  const [startDateWaiting, setStartDateWaiting] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedDatesMap, setSelectedDatesMap] = useState({});

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const todayString = new Date().toISOString().split('T')[0];

  const buildReservedMap = (reserved) => {
    const rMap = {};
    reserved.forEach(({ startDate, endDate }) => {
      const dates = getDatesBetween(startDate, endDate, COLORS.secondary, COLORS.white);
      Object.keys(dates).forEach(d => {
        rMap[d] = {
          ...dates[d],
          disabled: true,
          disableTouchEvent: true,
          startingDay: d === startDate,
          endingDay: d === endDate,
        };
      });
    });
    return rMap;
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const t = await AsyncStorage.getItem('token');
          const userId = await AsyncStorage.getItem('user_id');
          setIsLoggedIn(!!t);
          setToken(t);

          const [resVehicle, resReservations] = await Promise.all([
            axios.get(`${API_BASE_URL}/vehicles/${vehicleId}`),
            axios.get(`${API_BASE_URL}/vehicles/${vehicleId}/reservations`)
          ]);

          setVehicle(resVehicle.data);
          setReservedDatesMap(buildReservedMap(resReservations.data || []));

          if (t && userId) {
            axios.post(`${API_BASE_URL}/activities`, {
              user: userId,
              vehicle: vehicleId,
            }, {
              headers: { Authorization: `Bearer ${t}` }
            }).catch(e => console.log("Aktywność nie została zapisana (opcjonalne)"));
          }

        } catch (err) {
          console.error("Błąd ładowania strony pojazdu:", err);
          setError("Nie udało się załadować danych pojazdu.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [vehicleId])
  );

  const handleDayPress = (day) => {
    const dayString = day.dateString;
    if (reservedDatesMap[dayString]) {
      Alert.alert('Błąd', 'Wybrany dzień jest już zarezerwowany!');
      return;
    }

    if (!startDateWaiting) {
      setStartDateWaiting(dayString);
      setSelectedRange(null);
      setSelectedDatesMap({
        [dayString]: { startingDay: true, endingDay: true, color: COLORS.primary, textColor: COLORS.white },
      });
      return;
    }

    if (startDateWaiting === dayString) {
      setSelectedRange({ start: dayString, end: dayString });
      setStartDateWaiting(null);
      return;
    }

    if (parseISODate(dayString).getTime() < parseISODate(startDateWaiting).getTime()) {
      setStartDateWaiting(dayString);
      setSelectedRange(null);
      setSelectedDatesMap({
        [dayString]: { startingDay: true, endingDay: true, color: COLORS.primary, textColor: COLORS.white },
      });
      return;
    }

    const collides = rangeCollidesWithReserved(startDateWaiting, dayString, reservedDatesMap);
    if (collides) {
      Alert.alert('Błąd', 'Okres zachodzi na zarezerwowane dni.');
      return;
    }

    const finalMap = buildSelectedDatesMap(startDateWaiting, dayString, COLORS);
    setSelectedDatesMap(finalMap);
    setSelectedRange({ start: startDateWaiting, end: dayString });
    setStartDateWaiting(null);
  };

  const reserveVehicle = async () => {
    if (!isLoggedIn) {
      Alert.alert('Zaloguj się', 'Zaloguj się, aby dokonać rezerwacji.');
      navigation.navigate('Account');
      return;
    }
    if (!selectedRange) {
      Alert.alert('Błąd', 'Wybierz daty w kalendarzu.');
      return;
    }

    try {
      setLoading(true);
      const start = parseISODate(selectedRange.start);
      const end = parseISODate(selectedRange.end);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const cost = days * vehicle.rentalPricePerDay;

      await axios.post(`${API_BASE_URL}/reservations`, {
        vehicleId,
        startDate: selectedRange.start,
        endDate: selectedRange.end,
        cost
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Sukces', 'Zarezerwowano pojazd!');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Rezerwacja nie powiodła się.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !vehicle) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} testID="loading-indicator"/>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={vehicle?.image ? { uri: vehicle.image } : null}
        style={[styles.mainImage, !vehicle?.image && { backgroundColor: '#ccc' }]}
      />

      <View style={styles.content}>
        <Text style={styles.makeModel}>{vehicle?.make} {vehicle?.model}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Cena za dzień:</Text>
          <Text style={styles.priceValue}>{vehicle?.rentalPricePerDay} PLN</Text>
        </View>

        <Text style={styles.sectionTitle}>Parametry pojazdu</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Rok produkcji</Text>
                    <Text style={styles.infoValue}>{vehicle?.year}</Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Przebieg</Text>
                    <Text style={styles.infoValue}>{vehicle?.mileage} km</Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Kolor</Text>
                    <Text style={styles.infoValue}>{vehicle?.color}</Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Typ</Text>
                    <Text style={styles.infoValue}>{vehicle?.type}</Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Lokalizacja</Text>
                    <Text style={styles.infoValue}>{vehicle?.location}</Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[styles.infoValue, { color: vehicle?.available ? '#28a745' : '#dc3545' }]}>
                      {vehicle?.available ? 'Dostępny' : 'Zajęty'}
                    </Text>
                  </View>
                </View>


        <Text style={styles.sectionTitle}>Kalendarz</Text>
        <Calendar
          markingType={'period'}
          markedDates={{ ...reservedDatesMap, ...selectedDatesMap }}
          minDate={todayString}
          onDayPress={handleDayPress}
          theme={{ selectedDayBackgroundColor: COLORS.primary, arrowColor: COLORS.primary }}
        />
        <ColorLegend />

        <TouchableOpacity
          style={[styles.reserveButton, (!selectedRange) && styles.disabledButton]}
          onPress={reserveVehicle}
          disabled={loading}
        >
          <Text style={styles.reserveButtonText}>
            {isLoggedIn ? 'Zarezerwuj teraz' : 'Zaloguj się, aby zarezerwować'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mainImage: {
    width: screenWidth,
    height: 250
  },
  content: {
    padding: 16
  },
  makeModel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 20
  },
  priceLabel: {
    flex: 1,
    color: '#666'
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  reserveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  legendContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15
  },
  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5
  },
  legendText: {
    fontSize: 12,
    color: '#666'
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20
  },
  infoBox: {
    width: '48%',
    backgroundColor: '#F1F4F9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10
  },
  infoLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333'
  }
});
