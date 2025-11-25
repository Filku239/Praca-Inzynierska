import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function VehiclesScreen() {
  const navigation = useNavigation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get('http://0.0.0.0:3000/vehicles/accepted');
        setVehicles(response.data);
      } catch (err) {
        console.error(err);
        setError('Nie udało się pobrać pojazdów');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) return <Text>Ładowanie...</Text>;
  if (error) return <Text>{error}</Text>;

  const renderVehicle = ({ item }) => (
    <TouchableOpacity
      style={styles.vehicleItem}
      onPress={() => navigation.navigate('SingleVehicle', { vehicleId: item._id })}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>Brak zdjęcia</Text>
        </View>
      )}

      <Text style={styles.makeModel}>{item.make} {item.model}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Rok:</Text>
        <Text style={styles.value}>{item.year}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Przebieg:</Text>
        <Text style={styles.value}>{item.mileage} km</Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>CENA / DZIEŃ</Text>
        <Text style={styles.priceValue}>{item.rentalPricePerDay} PLN</Text>
      </View>
    </TouchableOpacity>
  );


  return (
    <FlatList
      data={vehicles}
      keyExtractor={(item) => item._id}
      renderItem={renderVehicle}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vehicleItem: {
      width: ITEM_WIDTH,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    image: {
      width: '100%',
      height: 140,
      borderRadius: 10,
      marginBottom: 10,
      backgroundColor: '#eee',
    },
    imagePlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      color: '#999',
      fontSize: 14,
    },
    makeModel: {
      fontWeight: '700',
      fontSize: 16,
      marginBottom: 6,
      color: '#333',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    label: {
      fontSize: 12,
      color: '#777',
    },
    value: {
      fontSize: 12,
      color: '#333',
      fontWeight: '600',
    },
    priceContainer: {
      marginTop: 8,
      backgroundColor: '#ff6347',
      paddingVertical: 6,
      borderRadius: 6,
      alignItems: 'center',
    },
    priceLabel: {
      fontSize: 10,
      color: '#fff',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    priceValue: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
      marginTop: 2,
    },
});