
// screens/LoginScreen.js
import React, { useEffect, useState } from 'react';
import { View, Button, Alert, Text } from 'react-native';
import styles from '../styles/style.js'; // Adjust the path as needed
import { useNavigation } from '@react-navigation/native';
import keycloakConfig from '../keycloakConfig.js'; // Ensure the keycloakConfig is properly set
import { authorize } from 'react-native-app-auth';

function LoginScreen() {
  const navigation = useNavigation();

  // Function to handle simple login
  const handleLogin = async () => {
    try {
      const authState = await authorize(keycloakConfig); // Simple Login
      // Extract the client roles assigned to the user
      let userRole = '';
      if (authState?.accessToken) {
        const tokenPayload = JSON.parse(atob(authState.accessToken.split('.')[1]));
        const clientRoles = tokenPayload?.resource_access?.[keycloakConfig.clientId]?.roles || [];
        if (clientRoles.includes('Admin-Client')) {
          userRole = 'Admin-Client';
        } else if (clientRoles.includes('User-Client')) {
          userRole = 'User-Client';
        }
      }

      navigation.navigate('User', { authStateString: JSON.stringify(authState), userRole });
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Authentication Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Login"
        onPress={handleLogin}
      />
    </View>
  );
}

export default LoginScreen;
