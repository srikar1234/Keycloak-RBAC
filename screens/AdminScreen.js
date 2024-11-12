
// screens/AdminScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import styles from '../styles/style.js';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logoutUser } from './LogoutUser.js';
import keycloakConfig from '../keycloakConfig.js';

function AdminScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // Parsing the authState string to convert it back to an object for use
  const userRole = route.params?.userRole;
  const authState = JSON.parse(route.params?.authStateString);
  const refreshToken = authState?.refreshToken;
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState('');
  const tokenPayload = JSON.parse(atob(authState.accessToken.split('.')[1]));
  const clientRoles = tokenPayload?.resource_access?.account?.roles || [];
  const associatedRoles = clientRoles.map(role => `Role: ${role}`).join('\n');

  let timer;

  useEffect(() => {
    console.log('Admin authenticated successfully');

    // Calculate the time left for token expiration
    const expiryTime = tokenPayload.exp * 1000 - Date.now();
    setTimeLeft(Math.max(0, Math.floor(expiryTime / 1000))); // Set initial time left in seconds

    // Set up an interval to update the time left every second
    timer = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        if (prevTimeLeft <= 1) {
          // Clear the interval and logout the admin when the timer reaches zero
          clearInterval(timer);
          handleLogout();
          return 0;
        }
        return prevTimeLeft - 1; // Decrement the time left by one second
      });
    }, 1000);

    // Clear the interval when the component unmounts
    return () => clearInterval(timer);
  }, []);

  // Function to handle admin logout
  const handleLogout = async () => {
    try {
      await logoutUser(refreshToken);
      Alert.alert('Logout Successful', 'Admin has been logged out');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  // Function to handle refresh token
  const handleRefreshToken = async () => {
    try {
      const response = await fetch(`${keycloakConfig.issuer}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
          refresh_token: refreshToken,
        }).toString(),
      });

      if (response.ok) {
        const newAuthState = await response.json();
        setTimeLeft(Math.max(0, Math.floor(newAuthState.expires_in)));
        Alert.alert('Token Refreshed', 'Token timer has been reset');
      } else {
        Alert.alert('Error', 'Failed to refresh token');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to refresh token: ${error.message}`);
    }
  };

  // Function to display admin permissions
  const handlePermissionsPress = () => {
    setMessage(`Admin roles associated with the client:\n${associatedRoles}`);
  };

  // Function to display admin role
  const handleRolePress = () => {
    setMessage(`Admin role: ${userRole}`);
  };

  // Function to fetch admin profile data
  const handleUserProfilePress = async () => {
    try {
      const response = await fetch(`${keycloakConfig.issuer}/protocol/openid-connect/userinfo`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setMessage(`Admin Profile Data:\n${JSON.stringify(userData, null, 2)}`);
      } else {
        Alert.alert('Error', 'Failed to fetch admin profile data');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to fetch admin profile data: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Admin Screen</Text>
      <Text>{message}</Text>
      <Text>Time left until token expires: {timeLeft} seconds</Text>
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <Button
            title="Show Permissions"
            onPress={handlePermissionsPress}
          />
        </View>
        <View style={styles.gridItem}>
          <Button
            title="Show Role"
            onPress={handleRolePress}
          />
        </View>
        <View style={styles.gridItem}>
          <Button
            title="Logout"
            onPress={handleLogout}
          />
        </View>
        <View style={styles.gridItem}>
          <Button
            title="Refresh Token"
            onPress={handleRefreshToken}
          />
        </View>
      </View>
    </View>
  );
}

export default AdminScreen;