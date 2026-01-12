import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChangePasswordScreen from '../components/ChangePasswordScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('ChangePasswordScreen', () => {
  const mockNavigation = { goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('shows error when fields are empty', () => {
    // ARRANGE
    const { getByTestId } = render(<ChangePasswordScreen navigation={mockNavigation} />);

    // ACT
    fireEvent.press(getByTestId('changePasswordButton'));

    // ASSERT
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Wypełnij wszystkie pola.');
  });

  it('shows error when passwords do not match', () => {
    // ARRANGE
    const { getByTestId, getByPlaceholderText } = render(<ChangePasswordScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByPlaceholderText('Wpisz stare hasło'), 'old123');
    fireEvent.changeText(getByPlaceholderText('Wpisz nowe hasło'), 'new123');
    fireEvent.changeText(getByPlaceholderText('Powtórz nowe hasło'), 'diff123');

    // ACT
    fireEvent.press(getByTestId('changePasswordButton'));

    // ASSERT
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nowe hasła muszą być takie same.');
  });

  it('shows error when token or user_id is missing', async () => {
    // ARRANGE
    AsyncStorage.getItem.mockResolvedValueOnce(null).mockResolvedValueOnce('123');
    const { getByTestId, getByPlaceholderText } = render(<ChangePasswordScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByPlaceholderText('Wpisz stare hasło'), 'old123');
    fireEvent.changeText(getByPlaceholderText('Wpisz nowe hasło'), 'new123');
    fireEvent.changeText(getByPlaceholderText('Powtórz nowe hasło'), 'new123');

    // ACT
    fireEvent.press(getByTestId('changePasswordButton'));

    // ASSERT
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Brak autoryzacji. Zaloguj się ponownie.');
    });
  });

  it('calls fetch and shows success alert', async () => {
    // ARRANGE
    AsyncStorage.getItem.mockResolvedValueOnce('token123').mockResolvedValueOnce('user123');
    global.fetch = jest.fn().mockResolvedValueOnce({ status: 200 });
    const { getByTestId, getByPlaceholderText } = render(<ChangePasswordScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByPlaceholderText('Wpisz stare hasło'), 'old123');
    fireEvent.changeText(getByPlaceholderText('Wpisz nowe hasło'), 'new123');
    fireEvent.changeText(getByPlaceholderText('Powtórz nowe hasło'), 'new123');

    // ACT
    fireEvent.press(getByTestId('changePasswordButton'));

    // ASSERT
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Sukces', 'Hasło zostało zmienione.');
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('shows error alert on wrong old password', async () => {
    // ARRANGE
    AsyncStorage.getItem.mockResolvedValueOnce('token123').mockResolvedValueOnce('user123');
    global.fetch = jest.fn().mockResolvedValueOnce({ status: 400 });
    const { getByTestId, getByPlaceholderText } = render(<ChangePasswordScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByPlaceholderText('Wpisz stare hasło'), 'old123');
    fireEvent.changeText(getByPlaceholderText('Wpisz nowe hasło'), 'new123');
    fireEvent.changeText(getByPlaceholderText('Powtórz nowe hasło'), 'new123');

    // ACT
    fireEvent.press(getByTestId('changePasswordButton'));

    // ASSERT
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nieprawidłowe stare hasło.');
    });
  });
});
