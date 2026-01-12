jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  }
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: jest.fn().mockImplementation((callback) => {
    callback();
    return jest.fn();
  }),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VehiclesScreen from '../components/VehiclesScreen';
import axios from 'axios';

const mockVehicles = [
  { _id: '1', make: 'Toyota', model: 'Corolla', year: 2020, mileage: 50000, rentalPricePerDay: 150, location: 'Warszawa' },
  { _id: '2', make: 'BMW', model: 'X5', year: 2022, mileage: 20000, rentalPricePerDay: 300, location: 'Kraków' },
];

describe('VehiclesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockClear();
  });

  test('renders vehicles list after successful API call', async () => {
    axios.get.mockResolvedValue({ data: mockVehicles });
    const { queryByText } = render(<VehiclesScreen />);

    await waitFor(() => {
      expect(queryByText('Ładowanie pojazdów...')).toBeNull();
      expect(queryByText('Toyota Corolla')).toBeTruthy();
    });
  });

  test('toggles filters visibility', async () => {
    axios.get.mockResolvedValue({ data: mockVehicles });
    const { getByText, queryByPlaceholderText } = render(<VehiclesScreen />);

    await waitFor(() => {
      expect(getByText('Pokaż filtry')).toBeTruthy();
    });

    expect(queryByPlaceholderText('Miasto')).toBeNull();
    fireEvent.press(getByText('Pokaż filtry'));
    
    await waitFor(() => {
      expect(queryByPlaceholderText('Miasto')).toBeTruthy();
    });
  });

  test('filters by location', async () => {
    axios.get.mockResolvedValue({ data: mockVehicles });
    const { getByText, getByPlaceholderText, queryByText } = render(<VehiclesScreen />);

    await waitFor(() => {
      expect(getByText('Pokaż filtry')).toBeTruthy();
    });

    fireEvent.press(getByText('Pokaż filtry'));
    const cityInput = getByPlaceholderText('Miasto');
    fireEvent.changeText(cityInput, 'Warszawa');

    await waitFor(() => {
      expect(queryByText('BMW X5')).toBeNull();
    });
  });

  it('filters by location and make', async () => {
    axios.get.mockResolvedValueOnce({ data: mockVehicles });
    const { getByText, getByPlaceholderText, queryByText } = render(<VehiclesScreen />);

    await waitFor(() => getByText('Pokaż filtry'));
    fireEvent.press(getByText('Pokaż filtry'));

    fireEvent.changeText(getByPlaceholderText('Miasto'), 'Kraków');
fireEvent.changeText(getByPlaceholderText('Marka'), 'BMW');

await waitFor(() => {
  expect(queryByText('BMW X5')).toBeTruthy();
  expect(queryByText('Toyota Corolla')).toBeNull();
});
  });
});
