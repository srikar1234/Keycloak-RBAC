//screens/LoginUser.js
import keycloakConfig from '../keycloakConfig.js';
import {Alert} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { authorize } from 'react-native-app-auth';

export const handleLogin = async () => {
  const navigation = useNavigation();
  try {
    const authState = await authorize(keycloakConfig);
    let userRole = '';
    if (authState?.accessToken) {
      const tokenPayload = JSON.parse(atob(authState.accessToken.split('.')[1]));
      const clientRoles = tokenPayload?.resource_access?.[keycloakConfig.clientId]?.roles || [];
      if (clientRoles.includes('Admin-Client-1')) {
        userRole = 'Admin-Client';
      } else if (clientRoles.includes('User-Client-1')) {
        userRole = 'User-Client';
      }
      else if (clientRoles.includes('POSP-Client-1')) {
        userRole = 'POSP-Client';
      }
    }
    console.log("User ROle: "+ userRole);
    navigation.navigate('User', { authStateString: JSON.stringify(authState), userRole });
  } catch (error) {
    console.error('Error during login:', error);
    Alert.alert('Authentication Failed', error.message);
  }
};