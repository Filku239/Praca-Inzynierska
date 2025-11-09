import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './components/HomeScreen';
import VehiclesScreen from './components/VehiclesScreen';
import AccountScreen from './components/AccountScreen';
import ProfileScreen from './components/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    checkToken();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let icon;

            if (route.name === 'Home') {
              icon = require('./assets/home.png');
            } else if (route.name === 'Vehicles') {
              icon = require('./assets/vehicle.png');
            } else if (route.name === 'Account') {
              icon = require('./assets/account.png');
            }

            return <Image source={icon} style={{ width: size, height: size, tintColor: color }} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Strona główna' }} />
        <Tab.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Pojazdy' }} />
        <Tab.Screen
          name="Account"
          component={isLoggedIn ? ProfileScreen : AccountScreen}
          options={{ title: isLoggedIn ? 'Konto' : 'Zaloguj' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
