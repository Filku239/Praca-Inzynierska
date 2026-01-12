import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;
const BACKEND_URL = 'http://0.0.0.0:3000';

export default function VehiclesScreen() {
  const navigation = useNavigation();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const [filters, setFilters] = useState({
    location: '',
    make: '',
    type: '',
    minMileage: '',
    maxMileage: '',
    minPrice: '',
    maxPrice: '',
  });

  const vehicleTypes = [
    { label: 'Samochód osobowy', value: 'samochod' },
    { label: 'Motocykl', value: 'motocykl' },
    { label: 'SUV', value: 'suv' },
    { label: 'Van', value: 'van' },
    { label: 'Ciężarowy', value: 'ciezarowy' },
  ];

  useFocusEffect(
    React.useCallback(() => {
      const fetchVehicles = async () => {
        try {
          const res = await axios.get(`${BACKEND_URL}/vehicles/accepted`);
          setVehicles(res.data);
          setFilteredVehicles(res.data);
        } catch (err) {
          console.error(err);
          setError('Nie udało się pobrać pojazdów');
        } finally {
          setLoading(false);
        }
      };

      fetchVehicles();

      return () => {};
    }, [])
  );

  useEffect(() => {
    let temp = [...vehicles];

    if (filters.location)
      temp = temp.filter((v) =>
        v.location?.toLowerCase().includes(filters.location.toLowerCase())
      );

    if (filters.make)
      temp = temp.filter((v) =>
        v.make.toLowerCase().includes(filters.make.toLowerCase())
      );

    if (filters.type) temp = temp.filter((v) => v.type === filters.type);

    if (filters.minMileage)
      temp = temp.filter((v) => v.mileage >= parseFloat(filters.minMileage));
    if (filters.maxMileage)
      temp = temp.filter((v) => v.mileage <= parseFloat(filters.maxMileage));

    if (filters.minPrice)
      temp = temp.filter(
        (v) => v.rentalPricePerDay >= parseFloat(filters.minPrice)
      );
    if (filters.maxPrice)
      temp = temp.filter(
        (v) => v.rentalPricePerDay <= parseFloat(filters.maxPrice)
      );

    setFilteredVehicles(temp);
  }, [filters, vehicles]);

  const renderVehicle = ({ item }) => (
    <TouchableOpacity
      style={styles.vehicleItem}
      onPress={() =>
        navigation.navigate('SingleVehicle', { vehicleId: item._id })
      }
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

  const renderFilters = () => {
    if (!filtersVisible) return null;

    return (
      <View style={styles.filtersContainer}>
        <TextInput
          placeholder="Miasto"
          placeholderTextColor="#000"
          value={filters.location}
          onChangeText={(t) => setFilters({ ...filters, location: t })}
          style={styles.filterInput}
        />
        <TextInput
          placeholder="Marka"
          placeholderTextColor="#000"
          value={filters.make}
          onChangeText={(t) => setFilters({ ...filters, make: t })}
          style={styles.filterInput}
        />

        <View style={styles.rowInputs}>
          <TextInput
            placeholder="Min. przebieg"
            placeholderTextColor="#000"
            keyboardType="numeric"
            value={filters.minMileage}
            onChangeText={(t) => setFilters({ ...filters, minMileage: t })}
            style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
          />
          <TextInput
            placeholder="Max. przebieg"
            placeholderTextColor="#000"
            keyboardType="numeric"
            value={filters.maxMileage}
            onChangeText={(t) => setFilters({ ...filters, maxMileage: t })}
            style={[styles.filterInput, { flex: 1 }]}
          />
        </View>

        <View style={styles.rowInputs}>
          <TextInput
            placeholder="Min. cena"
            placeholderTextColor="#000"
            keyboardType="numeric"
            value={filters.minPrice}
            onChangeText={(t) => setFilters({ ...filters, minPrice: t })}
            style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
          />
          <TextInput
            placeholder="Max. cena"
            placeholderTextColor="#000"
            keyboardType="numeric"
            value={filters.maxPrice}
            onChangeText={(t) => setFilters({ ...filters, maxPrice: t })}
            style={[styles.filterInput, { flex: 1 }]}
          />
        </View>

        <View style={styles.typeButtonsContainer}>
          {vehicleTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                filters.type === type.value && styles.typeButtonActive,
              ]}
              onPress={() =>
                setFilters({
                  ...filters,
                  type: filters.type === type.value ? '' : type.value,
                })
              }
            >
              <Text
                style={[
                  styles.typeButtonText,
                  filters.type === type.value && styles.typeButtonTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}

        </View>
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() =>
              setFilters({
                location: '',
                make: '',
                type: '',
                minMileage: '',
                maxMileage: '',
                minPrice: '',
                maxPrice: '',
              })
            }
          >
            <Text style={styles.clearButtonText}>Wyczyść filtry</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  };


  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Ładowanie pojazdów...</Text>
      </View>
    );
  if (error)
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setFiltersVisible(!filtersVisible)}
      >
        <Text style={styles.toggleButtonText}>
          {filtersVisible ? 'Ukryj filtry' : 'Pokaż filtry'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item._id}
        renderItem={renderVehicle}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
        ListHeaderComponent={<View>{renderFilters()}</View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  toggleButton: {
    padding: 12,
    backgroundColor: '#007bff',
    alignItems: 'center',
    marginBottom: 10
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16
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
    elevation: 4
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#eee'
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: {
    color: '#999',
    fontSize: 14
  },
  makeModel: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
    color: '#333'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  label: {
    fontSize: 12,
    color: '#777'
  },
  value: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600'
  },
  priceContainer: {
    marginTop: 8,
    backgroundColor: '#ff6347',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },
  priceLabel: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2
  },
  filtersContainer: {
    backgroundColor: '#f8f9fb',
    padding: 16,
    margin: 10,
    borderRadius: 10
  },
  filterInput: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    color: '#000'
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  typeButton: {
    backgroundColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6
  },
  typeButtonActive: {
    backgroundColor: '#007bff'
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 8
  },
  clearButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  typeButtonText: {
    fontSize: 12,
    color: '#333'
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600'
  }
});
