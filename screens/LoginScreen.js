import React, { useState, useEffect } from 'react';
import { View, Button, Alert, Text } from 'react-native';
import styles from '../styles/style.js';
import { useNavigation } from '@react-navigation/native';
import keycloakConfig from '../keycloakConfig.js';
import { authorize, refresh } from 'react-native-app-auth';
import * as Keychain from 'react-native-keychain'; // Import react-native-keychain

function LoginScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // Function to check if there is an existing session
  const checkExistingSession = async () => {
    try {
      // Retrieve the access token from Keychain (if available)
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        console.log('Existing session found, access token:', credentials.password);
        return credentials.password; // Return the stored token
      } else {
        console.log('No existing session found');
        return null;
      }
    } catch (error) {
      console.error('Error retrieving stored token:', error);
      Alert.alert('Error', 'Could not check existing session');
      return null;
    }
  };

  // Function to handle SSO login if session exists, else perform normal login
  const handleLogin = async () => {
    setLoading(true);
    console.log('Login initiated...');

    try {
      const existingSession = await checkExistingSession();

      if (existingSession) {
        // If there is an existing session, perform SSO by refreshing the token (if necessary)
        console.log('Session found, performing SSO...');
        try {
          const refreshedAuthState = await refresh({
            ...keycloakConfig,
            refreshToken: existingSession, // Assuming you store the refresh token as well
          });
          console.log('SSO Successful, refreshed auth state:', refreshedAuthState);
          Alert.alert('SSO Successful', 'Session refreshed successfully.');
          navigation.navigate('User', { authStateString: JSON.stringify(refreshedAuthState) });
        } catch (error) {
          console.error('SSO refresh failed:', error);
          Alert.alert('SSO Failed', 'Could not refresh session');
        }
      } else {
        // If no session exists, initiate normal login process
        console.log('No existing session found, proceeding with login...');
        try {
          const authState = await authorize(keycloakConfig); // Perform redirection login
          console.log('Authentication state from redirection:', authState); // Log for debugging
          // Store the access token securely for future use (in Keychain)
          await Keychain.setGenericPassword('accessToken', authState.accessToken);
          console.log('Access token saved to Keychain');
          Alert.alert('Login Successful', 'User logged in successfully.');
          navigation.navigate('User', { authStateString: JSON.stringify(authState) });
        } catch (error) {
          console.error('Error during redirection login:', error);
          Alert.alert('Authentication Failed', error.message);
        }
      }
    } catch (error) {
      console.error('Error during login flow:', error);
      Alert.alert('Login Failed', 'An error occurred during login.');
    } finally {
      setLoading(false);
      console.log('Login process completed');
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Login"
        onPress={handleLogin}
        disabled={loading}
      />
      {loading && <Text>Loading...</Text>}
    </View>
  );
}

export default LoginScreen;
