import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MyVehicles from '../components/MyVehiclesScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (callback) => {
      setImmediate(callback);
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));

describe('MyVehicles Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading text when vehicles are loading', () => {
    const { getByText } = render(<MyVehicles />);
    expect(getByText('Ładowanie pojazdów...')).toBeTruthy();
  });

  it('renders vehicles list', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('token')
      .mockResolvedValueOnce('user123');

    axios.get.mockResolvedValueOnce({
      data: [
        { _id: '1', make: 'Toyota', model: 'Corolla', year: 2020, rentalPricePerDay: 150 },
        { _id: '2', make: 'Honda', model: 'Civic', year: 2019, rentalPricePerDay: 120 }
      ]
    });

    const { getByText } = render(<MyVehicles />);

    await waitFor(() => {
      expect(getByText('Toyota Corolla')).toBeTruthy();
      expect(getByText('Honda Civic')).toBeTruthy();
    });
  });

  it('deletes vehicle', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('token') 
      .mockResolvedValueOnce('user123')
      .mockResolvedValueOnce('token');

    axios.get.mockResolvedValueOnce({
      data: [{ _id: '1', make: 'Toyota', model: 'Corolla', year: 2020, rentalPricePerDay: 150 }]
    });
    
    axios.delete.mockResolvedValueOnce({});

    const { getByText, queryByText } = render(<MyVehicles />);

    await waitFor(() => {
      expect(getByText('Toyota Corolla')).toBeTruthy();
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementationOnce((title, message, buttons) => {
      setImmediate(() => {
        if (Array.isArray(buttons) && buttons[1]?.onPress) {
          buttons[1].onPress();
        }
      });
    });

    fireEvent.press(getByText('Usuń'));

    await waitFor(
      () => {
        expect(axios.delete).toHaveBeenCalledWith(
          expect.stringContaining('/vehicles/1'),
          expect.any(Object)
        );
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(queryByText('Toyota Corolla')).toBeNull();
    });
  });
});
