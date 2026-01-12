import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddVehicleScreen from '../components/AddVehicleScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import { Alert } from 'react-native';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
launchImageLibrary.mockImplementation((options, callback) => {
  callback({ didCancel: false, assets: [{ uri: 'file://mockimage.jpg' }] });
});

jest.mock('axios');

jest.mock('../config', () => ({
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_UPLOAD_PRESET: 'preset',
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ secure_url: 'https://mockimage.com/car.jpg' }),
  })
);

describe('AddVehicleScreen', () => {
  beforeEach(() => {
    // ARRANGE
    AsyncStorage.getItem.mockResolvedValue('123');
    axios.post.mockResolvedValue({ data: {} });
    fetch.mockClear();
    Alert.alert.mockClear();
  });

  it('opens modal and selects vehicle type', async () => {
    // ARRANGE
    const { getByText, queryByText } = render(<AddVehicleScreen />);

    // ACT
    fireEvent.press(getByText('Wybierz typ pojazdu'));
    expect(getByText('Samochód osobowy')).toBeTruthy();

    fireEvent.press(getByText('SUV'));

    // ASSERT
    await waitFor(() => {
      expect(queryByText('Samochód osobowy')).toBeNull();
    });
    expect(getByText('SUV')).toBeTruthy();
  });

  it('uploads image and submits form', async () => {
    // ARRANGE
    const { getByText, getByPlaceholderText } = render(<AddVehicleScreen />);

    // ACT
    fireEvent.changeText(getByPlaceholderText('np. Toyota'), 'Toyota');
    fireEvent.changeText(getByPlaceholderText('np. Corolla'), 'Corolla');
    fireEvent.changeText(getByPlaceholderText('2020'), '2020');
    fireEvent.changeText(getByPlaceholderText('np. Warszawa'), 'Warszawa');
    fireEvent.changeText(getByPlaceholderText('150'), '150');

    fireEvent.press(getByText('Wybierz typ pojazdu'));
    fireEvent.press(getByText('Samochód osobowy'));

    fireEvent.press(getByText('Wybierz zdjęcie pojazdu'));

    fireEvent.press(getByText('Zapisz pojazd'));

    // ASSERT
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.cloudinary.com/v1_1/'),
        expect.any(Object)
      );

      expect(axios.post).toHaveBeenCalledWith(
        'http://0.0.0.0:3000/vehicles',
        expect.objectContaining({ make: 'Toyota', model: 'Corolla' }),
        expect.any(Object)
      );
    });
  });

  it('shows alert if required fields are missing', async () => {
    // ARRANGE
    const { getByText } = render(<AddVehicleScreen />);

    // ACT
    fireEvent.press(getByText('Zapisz pojazd'));

    // ASSERT
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Uzupełnij wymagane pola.');
    });
  });
});