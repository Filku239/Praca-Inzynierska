import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL, COLORS } from "./constants/Config";

const formatDate = (date) =>
  new Date(date).toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

export default function HistoryScreen() {
  const [viewHistory, setViewHistory] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");

      if (!token || !userId) return;

      const [resHistory, resReservations] = await Promise.all([
        axios.get(`${API_BASE_URL}/activities/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/reservations/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setViewHistory(
        (resHistory.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
      );

      setReservations(
        (resReservations.data || [])
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
          .slice(0, 3)
      );
    } catch (err) {
      console.log("Błąd pobierania danych:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await axios.delete(`${API_BASE_URL}/reservations/${reservationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Sukces", "Rezerwacja została anulowana.");
      loadData();
    } catch (err) {
      console.log("Błąd anulowania:", err.response?.data || err);
      Alert.alert("Błąd", "Nie udało się anulować rezerwacji.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text>Ładowanie...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📅 Twoje Rezerwacje</Text>

      {reservations.length === 0 ? (
        <Text style={styles.empty}>Brak rezerwacji.</Text>
      ) : (
        reservations.map((r) => {
          const vehicle = r.vehicle;
          if (!vehicle) return null;

          const isPastReservation = new Date(r.endDate) < new Date();

          return (
            <View key={r._id} style={styles.reservationCard}>
              <Text style={styles.resTitle}>
                🚗 {vehicle.make} {vehicle.model}
              </Text>

              <Text style={styles.small}>📍 {vehicle.location}</Text>
              <Text>Od: {formatDate(r.startDate)}</Text>
              <Text>Do: {formatDate(r.endDate)}</Text>

              <Text style={styles.price}>💰 {r.cost} PLN</Text>

              <TouchableOpacity
                disabled={isPastReservation}
                style={[
                  styles.cancelButton,
                  isPastReservation && styles.cancelButtonDisabled,
                ]}
                onPress={() => cancelReservation(r._id)}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    isPastReservation && styles.cancelButtonTextDisabled,
                  ]}
                >
                  {isPastReservation
                    ? "Rezerwacja zakończona"
                    : "Anuluj rezerwację"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <Text style={styles.title}>👀 Ostatnio Oglądane</Text>

      {viewHistory.length === 0 ? (
        <Text style={styles.empty}>Brak historii przeglądania.</Text>
      ) : (
        viewHistory.map((item) => {
          const vehicle = item.vehicle;
          if (!vehicle) return null;

          return (
            <View key={item._id} style={styles.card}>
              <Image source={{ uri: vehicle.image }} style={styles.image} />
              <View style={styles.cardBody}>
                <Text style={styles.vehicleName}>
                  {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.small}>Rok: {vehicle.year}</Text>
                <Text style={styles.small}>
                  Cena: {vehicle.rentalPricePerDay} PLN/dzień
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 15,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 10,
    color: COLORS.textDark,
  },
  empty: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    flexDirection: "row",
    marginBottom: 12,
    overflow: "hidden",
    elevation: 3,
  },
  image: {
    width: 110,
    height: 90,
  },
  cardBody: {
    padding: 10,
    flex: 1,
  },
  vehicleName: {
    fontWeight: "700",
    color: COLORS.textDark,
    fontSize: 16,
  },
  small: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  reservationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  resTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  price: {
    fontWeight: "800",
    color: COLORS.primary,
    fontSize: 16,
    marginTop: 5,
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  cancelButtonTextDisabled: {
    color: COLORS.textLight,
  },
});
