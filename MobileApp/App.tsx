import React, { useState, useCallback } from 'react';
import { Image } from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './components/HomeScreen';
import VehiclesScreen from './components/VehiclesScreen';
import AccountScreen from './components/AccountScreen';
import ProfileScreen from './components/ProfileScreen';
import AddVehicleScreen from './components/AddVehicleScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer
      onStateChange={async () => {
        const token = await AsyncStorage.getItem('token');
        setIsLoggedIn(!!token);
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let icon;
            if (route.name === 'Home') icon = require('./assets/home.png');
            else if (route.name === 'Vehicles') icon = require('./assets/vehicle.png');
            else if (route.name === 'Account') icon = require('./assets/account.png');
            else if (route.name === 'AddVehicle') icon = require('./assets/add.png');
            return <Image source={icon} style={{ width: size, height: size, tintColor: color }} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Strona główna' }} />
        <Tab.Screen name="Vehicles" component={VehiclesScreen} options={{ title: 'Pojazdy' }} />
        {isLoggedIn && (
                  <Tab.Screen
                    name="AddVehicle"
                    component={AddVehicleScreen}
                    options={{ title: 'Dodaj pojazd' }}
                  />
                )}
        <Tab.Screen
          name="Account"
          component={isLoggedIn ? ProfileScreen : AccountScreen}
          options={{ title: isLoggedIn ? 'Konto' : 'Zaloguj' }}
        />

      </Tab.Navigator>
    </NavigationContainer>
  );
}
