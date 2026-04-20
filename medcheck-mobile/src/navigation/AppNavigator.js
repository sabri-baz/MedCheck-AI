import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MyMedicinesScreen from '../screens/MyMedicinesScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: true, // We will show header for navigation
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'MedCheck Login' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen 
        name="MyMedicines" 
        component={MyMedicinesScreen} 
        options={{ title: 'MedCheck Dashboard' }}
      />
      <Stack.Screen 
        name="AddMedicine" 
        component={AddMedicineScreen} 
        options={{ title: 'Add New Medicine' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
