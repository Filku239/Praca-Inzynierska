import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config';


export default function AddVehicleScreen() {
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    mileage: '',
    type: '',
    location: '',
    rentalPricePerDay: '',
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => setForm({ ...form, [key]: value });
  const [userId, setUserId] = useState(null);
  const [selectedType, setSelectedType] = useState(form.type);


  const [modalVisible, setModalVisible] = useState(false);
  const vehicleTypes = [
    { label: 'Samochód osobowy', value: 'samochod' },
    { label: 'Motocykl', value: 'motocykl' },
    { label: 'SUV', value: 'suv' },
    { label: 'Van', value: 'van' },
    { label: 'Ciężarowy', value: 'ciezarowy' },
  ];

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('user_id');
        setUserId(id);
      } catch (e) {
        console.error('Błąd przy pobieraniu userId:', e);
      }
    };
    fetchUserId();
  }, []);

  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (asset?.uri) setImage(asset.uri);
    });
  };

  const uploadImageToCloudinary = async () => {
    if (!image) return null;
    const data = new FormData();
    data.append('file', { uri: image, type: 'image/jpeg', name: 'vehicle.jpg' });
    data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: data }
      );
      const json = await res.json();
      return json.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (
      !form.make ||
      !form.model ||
      !form.year ||
      !form.type ||
      !form.location ||
      !form.rentalPricePerDay
    ) {
      Alert.alert('Błąd', 'Uzupełnij wymagane pola.');
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImageToCloudinary();
      const payload = {
        ...form,
        year: parseInt(form.year),
        mileage: parseFloat(form.mileage),
        rentalPricePerDay: parseFloat(form.rentalPricePerDay),
        image: imageUrl,
        user: userId,
        available: true,
      };
      console.log('Sending payload to server:', payload);

      await axios.post('http://0.0.0.0:3000/vehicles', payload);

      Alert.alert('Sukces', 'Pojazd dodany!');
      setForm({
        make: '',
        model: '',
        year: '',
        color: '',
        mileage: '',
        type: '',
        location: '',
        rentalPricePerDay: '',
      });
      setImage(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nie udało się dodać pojazdu.');
    } finally {
      setLoading(false);
    }
  };

  const renderVehicleType = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        handleChange('type', item.value);
        setModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dodaj pojazd</Text>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Marka *</Text>
          <TextInput
            style={styles.input}
            value={form.make}
            onChangeText={(t) => handleChange('make', t)}
            placeholder="np. Toyota"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Model *</Text>
          <TextInput
            style={styles.input}
            value={form.model}
            onChangeText={(t) => handleChange('model', t)}
            placeholder="np. Corolla"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Rok *</Text>
          <TextInput
            style={styles.input}
            value={form.year}
            keyboardType="numeric"
            onChangeText={(t) => handleChange('year', t)}
            placeholder="2020"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Kolor</Text>
          <TextInput
            style={styles.input}
            value={form.color}
            onChangeText={(t) => handleChange('color', t)}
            placeholder="np. Czarny"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Przebieg (km)</Text>
          <TextInput
            style={styles.input}
            value={form.mileage}
            keyboardType="numeric"
            onChangeText={(t) => handleChange('mileage', t)}
            placeholder="45000"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Cena / dzień (zł) *</Text>
          <TextInput
            style={styles.input}
            value={form.rentalPricePerDay}
            keyboardType="numeric"
            onChangeText={(t) => handleChange('rentalPricePerDay', t)}
            placeholder="150"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Typ pojazdu *</Text>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: form.type ? '#000' : '#888', fontSize: 16 }}>
            {form.type
              ? vehicleTypes.find((v) => v.value === form.type)?.label
              : 'Wybierz typ pojazdu'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FlatList
              data={vehicleTypes}
              renderItem={renderVehicleType}
              keyExtractor={(item) => item.value}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Lokalizacja *</Text>
        <TextInput
          style={styles.input}
          value={form.location}
          onChangeText={(t) => handleChange('location', t)}
          placeholder="np. Warszawa"
        />
      </View>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Wybierz zdjęcie pojazdu</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Zapisz pojazd</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fb',
    alignItems: 'stretch',
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  half: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  formGroup: {
    marginVertical: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 10,
  },
  imagePicker: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageText: {
    color: '#666',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalItemText: {
    fontSize: 16,
  },
  modalClose: {
    marginTop: 10,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
