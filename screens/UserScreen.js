import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from '../styles/style.js';
import { logoutUser } from './LogoutUser.js';
import keycloakConfig from '../keycloakConfig.js';

function UserScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // State to manage authState and token expiration
  const [authState, setAuthState] = useState(() => JSON.parse(route.params?.authStateString));
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState('');
  const userRole = route.params?.userRole;

  useEffect(() => {
    if (route.params?.authStateString) {
      try {
        const updatedAuthState = JSON.parse(route.params.authStateString);
        setAuthState(updatedAuthState);
        console.log('Auth state updated from navigation parameters');
      } catch (error) {
        console.error('Failed to parse updated auth state:', error.message);
      }
    }
  }, [route.params?.authStateString]);

  // Token expiration handling
  useEffect(() => {
    if (!authState) {
      console.error('Auth state is not available');
      return;
    }

    console.log('User authenticated successfully');

    const currentAccessToken = authState.accessToken || authState.access_token;

    try {
      const tokenPayload = JSON.parse(atob(currentAccessToken.split('.')[1]));
      const expiryTime = tokenPayload.exp * 1000 - Date.now();

      setTimeLeft(Math.max(0, Math.floor(expiryTime / 1000))); // Set initial time left in seconds

      const timer = setInterval(() => {
        setTimeLeft((prevTimeLeft) => {
          if (prevTimeLeft <= 1) {
            clearInterval(timer);
            handleLogout(); // Logout the user when the timer reaches zero
            return 0;
          }
          return prevTimeLeft - 1;
        });
      }, 1000);

      return () => clearInterval(timer); // Cleanup interval
    } catch (error) {
      console.error('Failed to parse access token payload:', error.message);
    }
  }, [authState]);

  // Function to handle user logout
  const handleLogout = async () => {
    const currentRefreshToken = authState.refreshToken || authState.refresh_token;
    try {
      await logoutUser(currentRefreshToken);
      Alert.alert('Logout Successful', 'User has been logged out');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout Failed:', error.message);
      Alert.alert('Logout Failed', error.message);
    }
  };

  // Function to refresh token
  const handleRefreshToken = async () => {
    const currentRefreshToken = authState.refreshToken || authState.refresh_token;
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
          refresh_token: currentRefreshToken,
        }).toString(),
      });

      if (response.ok) {
        const newAuthState = await response.json();
        setAuthState(newAuthState); // Update the authState with the new token details
        setTimeLeft(Math.max(0, Math.floor(newAuthState.expires_in))); // Reset timer with new expiry time
        Alert.alert('Token Refreshed', 'Token timer has been reset');
      } else {
        console.error('Failed to refresh token.');
        Alert.alert('Error', 'Failed to refresh token');
      }
    } catch (error) {
      console.error('Failed to refresh token:', error.message);
      Alert.alert('Error', `Failed to refresh token: ${error.message}`);
    }
  };

  // Function to display the access token
  const handleShowAccessToken = () => {
    const currentAccessToken = authState.accessToken || authState.access_token;
    setMessage(`Access Token:\n${currentAccessToken}`);
  };

  // Function to display user permissions
  const handlePermissionsPress = () => {
    const currentAccessToken = authState.accessToken || authState.access_token;
    try {
      const tokenPayload = JSON.parse(atob(currentAccessToken.split('.')[1]));
      const clientRoles = tokenPayload?.resource_access?.account?.roles || [];
      const associatedRoles = clientRoles.map((role) => `Role: ${role}`).join('\n');
      setMessage(`User roles associated with the client:\n${associatedRoles}`);
    } catch (error) {
      console.error('Error parsing permissions:', error.message);
      setMessage('Failed to retrieve permissions.');
    }
  };

  // Function to display user role
  const handleRolePress = () => {
    setMessage(`User role: ${userRole}`);
  };

  // Function to navigate to Admin Screen
  const handleNavigateToAdminScreen = () => {
    if (userRole === 'Admin-Client') {
      navigation.navigate('Admin', { authStateString: JSON.stringify(authState), userRole });
    } else {
      Alert.alert('Access Denied', 'You do not have permission to access the Admin Screen.');
    }
  };

  return (
    <View style={styles.container}>
      <Text>User Screen</Text>
      <Text>{message}</Text>
      <Text>Time left until token expires: {timeLeft} seconds</Text> {/* Display the remaining time in seconds */}
      <View style={styles.gridContainer}>
        {userRole === 'Admin-Client' && (
          <View style={styles.gridItem}>
            <Button
              title="Go to Admin Screen"
              onPress={handleNavigateToAdminScreen}
            />
          </View>
        )}
        <View style={styles.gridItem}>
          <Button
            title="Show Access Token"
            onPress={handleShowAccessToken}
          />
        </View>
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

export default UserScreen;