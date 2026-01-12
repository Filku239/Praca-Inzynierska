import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import SingleVehicleScreen from '../components/SingleVehicleScreen';
import * as DateUtils from '../components/utils/DateUtils';

// --- MOCKI (bez TouchableOpacity w module factory) ---
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => {
    setImmediate(callback);
    return jest.fn();
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

// Prosty mock kalendarza (bez TouchableOpacity)
jest.mock('react-native-calendars', () => ({
  Calendar: 'Calendar', // Mock jako string - RTL obsłuży
}));

// Globalne spy
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('SingleVehicleScreen', () => {
  const mockVehicle = {
    _id: '1',
    make: 'Toyota',
    model: 'Corolla',
    rentalPricePerDay: 100,
    year: 2020,
    mileage: 50000,
    color: 'Red',
    type: 'Sedan',
    location: 'Warszawa',
    available: true,
    image: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    AsyncStorage.getItem
      .mockResolvedValueOnce('token')
      .mockResolvedValueOnce('user123');

    axios.get
      .mockResolvedValueOnce({ data: mockVehicle })
      .mockResolvedValueOnce({ data: [] });

    axios.post.mockResolvedValueOnce({});

    jest.spyOn(DateUtils, 'buildSelectedDatesMap').mockReturnValue({
      '2026-01-08': { startingDay: true, endingDay: true, color: 'blue', textColor: 'white' },
    });
  });

  it('renders loading indicator initially', () => {
    const { getByTestId } = render(
      <SingleVehicleScreen route={{ params: { vehicleId: '1' } }} />
    );
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders vehicle info after fetch', async () => {
    const { getByText } = render(
      <SingleVehicleScreen route={{ params: { vehicleId: '1' } }} />
    );
    await waitFor(() => expect(getByText(/Cena za dzień/)).toBeTruthy());
  });

 it('shows login prompt when not logged in', async () => {
  AsyncStorage.getItem.mockResolvedValueOnce(null);

  const { getByText } = render(
    <SingleVehicleScreen route={{ params: { vehicleId: '1' } }} />
  );

  await waitFor(() => expect(getByText('Toyota Corolla')).toBeTruthy());
  expect(getByText(/Zaloguj się, aby zarezerwować/)).toBeTruthy();
});
});
