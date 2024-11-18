// screens/LoginScreen.js
import React from 'react';
import { View, Button } from 'react-native';
import styles from '../styles/style.js'; // Adjust the path as needed
import { useNavigation } from '@react-navigation/native';


//screens/LoginUser.js
import keycloakConfig from '../keycloakConfig.js';
import {Alert} from 'react-native';

import { authorize } from 'react-native-app-auth';


function LoginScreen() {
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const authState = await authorize(keycloakConfig);
      let userRole = '';
      if (authState?.accessToken) {
        const tokenPayload = JSON.parse(atob(authState.accessToken.split('.')[1]));
        const clientRoles = tokenPayload?.resource_access?.[keycloakConfig.clientId]?.roles || [];
        console.log(tokenPayload);
        console.log(clientRoles);
        if (clientRoles.includes('Admin-Client')) {
          userRole = 'Admin-Client';
        } else if (clientRoles.includes('User-Client')) {
          userRole = 'User-Client';
        }
        else if (clientRoles.includes('POSP'))
          userRole = 'POSP';
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
      <Button
        title="User Registration"
        onPress={() => navigation.navigate('Registration')}
      />
    </View>
  );
}

export default LoginScreen;
