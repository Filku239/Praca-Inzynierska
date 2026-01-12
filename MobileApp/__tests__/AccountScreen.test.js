import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AccountScreen from '../components/AccountScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('axios');

describe('AccountScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });


  it('switches to the registration form', () => {
    const { getByText, queryByPlaceholderText } = render(<AccountScreen />);
    fireEvent.press(getByText('Nie masz konta? Zarejestruj się'));
    expect(getByText('Rejestracja')).toBeTruthy();
    expect(queryByPlaceholderText('Nazwa użytkownika')).toBeTruthy();
  });

  it('shows validation errors for a weak password', () => {
    const { getByText, getByPlaceholderText } = render(<AccountScreen />);
    fireEvent.press(getByText('Nie masz konta? Zarejestruj się'));
    fireEvent.changeText(getByPlaceholderText('Hasło'), 'abc');
    expect(getByText('• Minimum 8 znaków')).toHaveStyle({ color: 'red' });
    expect(getByText('• Co najmniej jedna wielka litera')).toHaveStyle({ color: 'red' });
    expect(getByText('• Co najmniej jedna cyfra')).toHaveStyle({ color: 'red' });
    expect(getByText('• Co najmniej jeden znak specjalny')).toHaveStyle({ color: 'red' });
  });

  it('registers a new user successfully', async () => {
  axios.post.mockResolvedValueOnce({ data: { message: 'Registered' } });

  const { getByText, getByPlaceholderText } = render(<AccountScreen />);
  fireEvent.press(getByText('Nie masz konta? Zarejestruj się'));

  fireEvent.changeText(getByPlaceholderText('Nazwa użytkownika'), 'JohnDoe');
  fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
  fireEvent.changeText(getByPlaceholderText('Hasło'), 'Abcd1234!');

  fireEvent.press(getByText('Zarejestruj się'));

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      'http://0.0.0.0:3000/users/register',
      { username: 'JohnDoe', email: 'john@example.com', password: 'Abcd1234!' }
    );
    expect(getByText('Logowanie')).toBeTruthy();
  });
});

it('logs in an existing user and stores credentials', async () => {
  axios.post.mockResolvedValueOnce({
    data: {
      token: 'fake-token',
      username: 'JohnDoe',
      email: 'john@example.com',
      role: 'user',
      id: '123',
    },
  });

  const { getByText, getByPlaceholderText } = render(<AccountScreen />);

  fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
  fireEvent.changeText(getByPlaceholderText('Hasło'), 'Abcd1234!');

  fireEvent.press(getByText('Zaloguj się'));

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      'http://0.0.0.0:3000/users/login',
      { email: 'john@example.com', password: 'Abcd1234!' }
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'fake-token');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('username', 'JohnDoe');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('email', 'john@example.com');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('role', 'user');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('user_id', '123');
  });
});

});
