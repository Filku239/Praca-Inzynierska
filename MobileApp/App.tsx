import React, { useState } from 'react';
import { Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './components/HomeScreen';
import VehiclesScreen from './components/VehiclesScreen';
import AccountScreen from './components/AccountScreen';
import ProfileScreen from './components/ProfileScreen';
import AddVehicleScreen from './components/AddVehicleScreen';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import SingleVehicleScreen from './components/SingleVehicleScreen';
import MyVehiclesScreen from './components/MyVehiclesScreen';
import HistoryScreen from './components/HistoryScreen';
import EditVehicleScreen from './components/EditVehicleScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AccountStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Zmiana hasła' }}
      />
       <Stack.Screen
             name="History"
             component={HistoryScreen}
             options={{title: 'Historia'}}
             />
       <Stack.Screen
               name="MyVehicles"
               component={MyVehiclesScreen}
               options={{title: 'Moje pojazdy'}}
               />
       <Stack.Screen
               name="EditVehicle"
               component={EditVehicleScreen}
               options={{title: 'Edytuj pojazd'}}
               />

    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SingleVehicle"
        component={SingleVehicleScreen}
        options={{ title: 'Szczegóły Pojazdu' }}
      />
    </Stack.Navigator>
  );
}

function VehiclesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VehiclesList"
        component={VehiclesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SingleVehicle"
        component={SingleVehicleScreen}
        options={{ title: 'Szczegóły Pojazdu' }}
      />

    </Stack.Navigator>
  );
}

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
            return (
              <Image
                source={icon}
                style={{ width: size, height: size, tintColor: color }}
              />
            );
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ title: 'Strona główna' }}
        />

        <Tab.Screen
          name="Vehicles"
          component={VehiclesStack}
          options={{ title: 'Pojazdy' }}
        />

        {isLoggedIn && (
          <Tab.Screen
            name="AddVehicle"
            component={AddVehicleScreen}
            options={{ title: 'Dodaj pojazd' }}
          />
        )}

        <Tab.Screen
          name="Account"
          component={isLoggedIn ? AccountStack : AccountScreen}
          options={{ title: isLoggedIn ? 'Konto' : 'Zaloguj' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}