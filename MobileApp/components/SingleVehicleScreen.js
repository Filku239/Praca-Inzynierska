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

  const buildReservedMap = (reserved) => {
    const rMap = {};
    reserved.forEach(({ startDate, endDate }) => {
      const dates = getDatesBetween(startDate, endDate, COLORS.secondary, COLORS.white);
      const startKey = startDate;
      const endKey = endDate;

      Object.keys(dates).forEach(d => {
        rMap[d] = {
          ...dates[d],
          disabled: true,
          disableTouchEvent: true,
          startingDay: d === startKey,
          endingDay: d === endKey,
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
          setIsLoggedIn(!!t);
          setToken(t);

          const resVehicle = await axios.get(`${API_BASE_URL}/vehicles/${vehicleId}`);
          setVehicle(resVehicle.data);

          const resReservations = await axios.get(`${API_BASE_URL}/vehicles/${vehicleId}/reservations`);
          console.log("🟡 SUROWA ODPOWIEDŹ Z SERWERA:", resReservations.data);
          const reserved = resReservations.data || [];

          setReservedDatesMap(buildReservedMap(reserved));

        } catch (err) {
          console.error(err);
          setError("Nie udało się pobrać danych.");
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
      const singleMap = {
        [dayString]: { startingDay: true, endingDay: true, color: COLORS.primary, textColor: COLORS.white },
      };
      setSelectedDatesMap(singleMap);
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
      const singleMap = {
        [dayString]: { startingDay: true, endingDay: true, color: COLORS.primary, textColor: COLORS.white },
      };
      setSelectedDatesMap(singleMap);
      return;
    }

    const collides = rangeCollidesWithReserved(startDateWaiting, dayString, reservedDatesMap);
    if (collides) {
      Alert.alert('Błąd', 'Wybrany okres zachodzi na zarezerwowane dni.');
      const singleMap = {
        [startDateWaiting]: { startingDay: true, endingDay: true, color: COLORS.primary, textColor: COLORS.white },
      };
      setSelectedDatesMap(singleMap);
      setSelectedRange(null);
      return;
    }

    const finalMap = buildSelectedDatesMap(startDateWaiting, dayString, COLORS);
    setSelectedDatesMap(finalMap);
    setSelectedRange({ start: startDateWaiting, end: dayString });
    setStartDateWaiting(null);
  };

  const finalMarkedDates = { ...selectedDatesMap, ...reservedDatesMap };

  const reserveVehicle = async () => {
    if (!isLoggedIn || !token) {
      Alert.alert('Zaloguj się', 'Musisz być zalogowany, aby zarezerwować pojazd.');
      return;
    }
    if (!selectedRange) {
      Alert.alert('Brak dat', 'Wybierz okres rezerwacji.');
      return;
    }

    const user = await AsyncStorage.getItem('user_id');
        if (!user) {
          Alert.alert('Błąd', 'Nie znaleziono ID użytkownika.');
          return;
        }

    try {
      setLoading(true);
      const start = parseISODate(selectedRange.start);
      const end = parseISODate(selectedRange.end);
      const timeDiff = end.getTime() - start.getTime();
      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
      const cost = days * vehicle.rentalPricePerDay;

      const payload = {
        vehicleId,
        startDate: selectedRange.start,
        endDate: selectedRange.end,
        user,
        cost
      };

      await axios.post(`${API_BASE_URL}/reservations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newReservedMap = { ...reservedDatesMap };
      const added = getDatesBetween(payload.startDate, payload.endDate, COLORS.secondary, COLORS.white);
      const startKey = payload.startDate;
      const endKey = payload.endDate;

      Object.keys(added).forEach((d) => {
        newReservedMap[d] = {
          color: COLORS.secondary,
          textColor: COLORS.white,
          disabled: true,
          disableTouchEvent: true,
          startingDay: d === startKey,
          endingDay: d === endKey,
        };
      });

      setReservedDatesMap(newReservedMap);
      setSelectedRange(null);
      setSelectedDatesMap({});
      Alert.alert('Sukces', 'Rezerwacja została utworzona.');
    } catch (err) {
      setLoading(false);
      console.error("Błąd rezerwacji:", err.response ? err.response.data : err.message);

      if (err.response && err.response.status === 401) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user_id');
        setIsLoggedIn(false);
        setToken(null);
        Alert.alert('Wygasła sesja', 'Sesja wygasła lub dane logowania są niepoprawne. Zaloguj się ponownie.');
        navigation.navigate('Account');
      } else {
        Alert.alert('Błąd', 'Nie udało się utworzyć rezerwacji.');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text>Ładowanie...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {vehicle?.image ? (
        <Image source={{ uri: vehicle.image }} style={styles.mainImage} resizeMode="cover" />
      ) : (
        <View style={[styles.mainImage, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>Brak zdjęcia</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.makeModel}>
          {vehicle?.make} {vehicle?.model}
        </Text>
        <Text style={styles.subtitle}>
          {vehicle?.year} • {vehicle?.mileage} km
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Cena za dzień:</Text>
          <Text style={styles.priceValue}>{vehicle?.rentalPricePerDay} PLN</Text>
        </View>

        <Text style={styles.sectionTitle}>Opis pojazdu</Text>
        <Text style={styles.description}>{vehicle?.description || 'Brak opisu.'}</Text>

        <Text style={styles.sectionTitle}>Specyfikacja pojazdu</Text>
        <View style={styles.specsList}>
          <View style={styles.specRow}>
            <Text style={styles.specTitle}>Marka:</Text>
            <Text style={styles.specValue}>{vehicle?.make}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specTitle}>Model:</Text>
            <Text style={styles.specValue}>{vehicle?.model}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specTitle}>Rok produkcji:</Text>
            <Text style={styles.specValue}>{vehicle?.year}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specTitle}>Kolor:</Text>
            <Text style={styles.specValue}>{vehicle?.color}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specTitle}>Przebieg:</Text>
            <Text style={styles.specValue}>{vehicle?.mileage} km</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specTitle}>Typ pojazdu:</Text>
            <Text style={styles.specValue}>{vehicle?.type}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specTitle}>Lokalizacja:</Text>
            <Text style={styles.specValue}>{vehicle?.location}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specTitle}>Dostępność:</Text>
            <Text style={styles.specValue}>
              {vehicle?.available ? 'Dostępny' : 'Niedostępny'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Wybór daty rezerwacji</Text>
        <View style={styles.calendarContainer}>
          <Calendar
            markingType={'period'}
            markedDates={finalMarkedDates}
            onDayPress={handleDayPress}
            theme={{
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.white,
              todayTextColor: '#00adf5',
              arrowColor: COLORS.secondary,
              textSectionTitleColor: '#b6c1cd',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 16,
              'stylesheet.calendar.header': {
                dayHeader: {
                  color: COLORS.textDark,
                },
              },
            }}
          />
        </View>

        <ColorLegend />

        <View style={styles.dateRangeTextContainer}>
          <Text>
            Wybrany okres:{' '}
            <Text style={styles.dateRangeValue}>
              {selectedRange
                ? `${selectedRange.start} — ${selectedRange.end}`
                : startDateWaiting
                ? `Początek: ${startDateWaiting}`
                : 'Brak'}
            </Text>
          </Text>
        </View>

        {isLoggedIn ? (
          <TouchableOpacity
            style={[styles.reserveButton, !selectedRange && styles.disabledButton]}
            onPress={reserveVehicle}
            disabled={!selectedRange || loading}
          >
            <Text style={styles.reserveButtonText}>Zarezerwuj Pojazd</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.reserveButton, styles.disabledButton]}
            onPress={() => navigation.navigate('Account')}
          >
            <Text style={styles.reserveButtonText}>Zaloguj się, aby zarezerwować</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainImage: { width: screenWidth, height: screenWidth * 0.6, backgroundColor: COLORS.border },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: COLORS.textLight, fontSize: 18 },
  content: { padding: 16 },

  makeModel: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  subtitle: { fontSize: 16, color: COLORS.textLight, marginBottom: 16 },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  priceLabel: { fontSize: 14, color: COLORS.textLight, marginRight: 8, fontWeight: '600' },
  priceValue: { fontSize: 24, fontWeight: '800', color: COLORS.secondary },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 15,
    marginBottom: 10,
  },
  description: { fontSize: 14, color: COLORS.textLight, lineHeight: 22, marginBottom: 10 },

  specsList: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  specTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  specValue: {
    fontSize: 14,
    color: COLORS.textLight,
  },

  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateRangeTextContainer: { marginBottom: 20 },
  dateRangeValue: { fontWeight: '700', color: COLORS.primary },

  reserveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  reserveButtonText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  disabledButton: { backgroundColor: COLORS.disabled, elevation: 0, shadowOpacity: 0 },

  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
    marginTop: 5,
    paddingHorizontal: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  legendColorBox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textDark,
  },
});