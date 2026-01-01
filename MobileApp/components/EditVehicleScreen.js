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
import { useRoute, useNavigation } from '@react-navigation/native';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config';

const BACKEND_URL = 'http://0.0.0.0:3000';

export default function EditVehicleScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { vehicleId } = route.params;

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const vehicleTypes = [
    { label: 'Samochód osobowy', value: 'samochod' },
    { label: 'Motocykl', value: 'motocykl' },
    { label: 'SUV', value: 'suv' },
    { label: 'Van', value: 'van' },
    { label: 'Ciężarowy', value: 'ciezarowy' },
  ];

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${BACKEND_URL}/vehicles/${vehicleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const vehicleData = res.data;
        setForm({
          make: vehicleData.make || '',
          model: vehicleData.model || '',
          year: vehicleData.year?.toString() || '',
          color: vehicleData.color || '',
          mileage: vehicleData.mileage?.toString() || '',
          type: vehicleData.type || '',
          location: vehicleData.location || '',
          rentalPricePerDay: vehicleData.rentalPricePerDay?.toString() || '',
        });
        setImage(vehicleData.image || null);
      } catch (err) {
        console.error('Błąd pobierania pojazdu:', err);
        Alert.alert('Błąd', 'Nie udało się pobrać danych pojazdu.');
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [vehicleId]);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
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
      if (!json.secure_url) throw new Error('Upload failed');
      return json.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      Alert.alert('Błąd', 'Nie udało się przesłać zdjęcia.');
      return null;
    }
  };

  const handleSave = async () => {
    if (!form.make || !form.model || !form.year || !form.type || !form.location || !form.rentalPricePerDay) {
      Alert.alert('Błąd', 'Uzupełnij wymagane pola.');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const imageUrl = (await uploadImageToCloudinary()) || image;

      const payload = {
        ...form,
        year: parseInt(form.year),
        mileage: parseFloat(form.mileage) || 0,
        rentalPricePerDay: parseFloat(form.rentalPricePerDay),
        image: imageUrl,
      };

      await axios.put(`${BACKEND_URL}/vehicles/${vehicleId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Sukces', 'Pojazd został zaktualizowany.');
      navigation.goBack();
    } catch (err) {
      console.error('Błąd aktualizacji pojazdu:', err);
      Alert.alert('Błąd', 'Nie udało się zaktualizować pojazdu.');
    } finally {
      setSaving(false);
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

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Ładowanie pojazdu...</Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Marka *</Text>
          <TextInput style={styles.input} value={form.make} onChangeText={(t) => handleChange('make', t)} />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Model *</Text>
          <TextInput style={styles.input} value={form.model} onChangeText={(t) => handleChange('model', t)} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Rok *</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={form.year} onChangeText={(t) => handleChange('year', t)} />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Kolor</Text>
          <TextInput style={styles.input} value={form.color} onChangeText={(t) => handleChange('color', t)} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Przebieg (km)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={form.mileage} onChangeText={(t) => handleChange('mileage', t)} />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Cena / dzień (zł) *</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={form.rentalPricePerDay} onChangeText={(t) => handleChange('rentalPricePerDay', t)} />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Typ pojazdu *</Text>
        <TouchableOpacity style={styles.pickerContainer} onPress={() => setModalVisible(true)}>
          <Text style={{ color: form.type ? '#000' : '#888', fontSize: 16 }}>
            {form.type ? vehicleTypes.find((v) => v.value === form.type)?.label : 'Wybierz typ pojazdu'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FlatList data={vehicleTypes} renderItem={renderVehicleType} keyExtractor={(item) => item.value} />
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Lokalizacja *</Text>
        <TextInput style={styles.input} value={form.location} onChangeText={(t) => handleChange('location', t)} />
      </View>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? <Image source={{ uri: image }} style={styles.image} /> : <Text style={styles.imageText}>Wybierz zdjęcie pojazdu</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Zapisz pojazd</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fb',
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
