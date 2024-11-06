// screens/LoginScreen.js
import React from 'react';
import { View, Button, Alert } from 'react-native';
import { authorize } from 'react-native-app-auth';
import styles from '../styles/style.js';
import { useNavigation } from '@react-navigation/native';
import keycloakConfig from '../keycloakConfig';

function LoginScreen() {
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const authState = await authorize(keycloakConfig);
      navigation.navigate('User', { authStateString: JSON.stringify(authState) });
    } catch (error) {
      Alert.alert('Authentication Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Login with Keycloak"
        onPress={handleLogin}
      />
    </View>
  );
}

export default LoginScreen;