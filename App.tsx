import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen.js';
import UserScreen from './screens/UserScreen.js';
import AdminScreen from './screens/AdminScreen.js';
import UserRegistration from './screens/UserRegistration.js'
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="User" component={UserScreen} />
        <Stack.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            headerLeft: () => null, // Disable the back arrow button
            gestureEnabled: false, // Disable swipe gestures for going back
          }}
        />
        <Stack.Screen name="Registration" component={UserRegistration} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}