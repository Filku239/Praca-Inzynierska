import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const API_URL = 'http://0.0.0.0:3000';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [popularVehicles, setPopularVehicles] = useState([]);
  const [stats, setStats] = useState({ vehicles: 0, cities: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [popRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/vehicles/popular`),
          axios.get(`${API_URL}/stats`),
        ]);

        setPopularVehicles(popRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Błąd pobierania danych z serwera:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderVehicleCard = (vehicle) => (
    <TouchableOpacity
      key={vehicle._id}
      style={styles.popularCard}
      onPress={() => navigation.navigate('SingleVehicle', { vehicleId: vehicle._id })}
    >
      <View style={styles.imageContainer}>
        {vehicle.image ? (
          <Image source={{ uri: vehicle.image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.imagePlaceholder]} />
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TOP</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {vehicle.make} {vehicle.model}
        </Text>
        <Text style={styles.cardSubtitle}>
          {vehicle.type} • {vehicle.year}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            {vehicle.rentalPricePerDay} PLN <Text style={styles.perDay}>/ doba</Text>
          </Text>
          <View style={styles.circleBtn}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Znajdź idealny pojazd</Text>
          <Text style={styles.heroSubtitle}>Najlepsze oferty w Twoim mieście</Text>

          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Wyszukaj markę, model..."
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Najpopularniejsze</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Vehicles')}>
              <Text style={styles.seeAll}>Zobacz wszystkie</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.popularScroll}
          >
            {loading
              ? [1, 2, 3].map((item) => (
                  <View key={item} style={styles.popularCardSkeleton}>
                    <View style={styles.imagePlaceholderSkeleton} />
                    <View style={styles.cardContent}>
                      <View style={styles.lineLong} />
                      <View style={styles.lineShort} />
                    </View>
                  </View>
                ))
              : popularVehicles.map((vehicle) => renderVehicleCard(vehicle))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dlaczego my?</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.statNumber}>{stats.vehicles}+</Text>
              <Text style={styles.statLabel}>Pojazdów</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.statNumber}>{stats.cities}</Text>
              <Text style={styles.statLabel}>Miast</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.statNumber}>{stats.users}+</Text>
              <Text style={styles.statLabel}>Klientów</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  hero: {
    backgroundColor: '#007bff',
    padding: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 50,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#e0e0e0',
    fontSize: 16,
    marginTop: 5,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginTop: 25,
    paddingHorizontal: 15,
    height: 50,
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  searchInput: {
    fontSize: 16,
    color: '#000',
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  seeAll: {
    color: '#007bff',
    fontWeight: '600',
  },
  popularScroll: {
    marginLeft: -5,
  },
  popularCard: {
    width: width * 0.7,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 5,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    backgroundColor: '#E0E0E0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007bff',
  },
  perDay: {
    fontSize: 10,
    fontWeight: '400',
    color: '#999',
  },
  popularCardSkeleton: {
    width: width * 0.7,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  imagePlaceholderSkeleton: {
    height: 150,
    backgroundColor: '#E0E0E0',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6347',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 15,
  },
  lineLong: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    width: '80%',
    marginBottom: 8,
  },
  lineShort: {
    height: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    width: '40%',
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    width: '31%',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});