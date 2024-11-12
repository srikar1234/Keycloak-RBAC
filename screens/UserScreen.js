// screens/UserScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import styles from '../styles/style.js';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logoutUser } from './LogoutUser.js';
import keycloakConfig from '../keycloakConfig.js';

function UserScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Parsing the authState string to convert it back to an object for use
  const authState = JSON.parse(route.params?.authStateString);

  const refreshToken = authState?.refreshToken;
  const userRole = route.params?.userRole;
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const tokenPayload = JSON.parse(atob(authState.accessToken.split('.')[1]));
  const clientRoles = tokenPayload?.resource_access?.account?.roles || [];
  const associatedRoles = clientRoles.map(role => `Role: ${role}`).join('\n');

  let timer;

  useEffect(() => {
    console.log('User authenticated successfully');

    // Calculate the time left for token expiration
    const expiryTime = tokenPayload.exp * 1000 - Date.now();
    setTimeLeft(Math.max(0, Math.floor(expiryTime / 1000))); // Set initial time left in seconds

    // Set up an interval to update the time left every second
    timer = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        if (prevTimeLeft <= 1) {
          // Clear the interval and logout the user when the timer reaches zero
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

  // Function to handle user logout
  // This function will log the user out and navigate to the login screen
  const handleLogout = async () => {
    try {
      await logoutUser(refreshToken);
      Alert.alert('Logout Successful', 'User has been logged out');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  // Function to handle refresh token
  // This function will call the refresh token endpoint to obtain a new access token
  const handleRefreshToken = async () => {
    try {
      // Call the Keycloak refresh token endpoint to get a new access token
      const response = await fetch(`${keycloakConfig.issuer}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token', // Use the refresh token grant type
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
          refresh_token: refreshToken, // Provide the current refresh token
        }).toString(),
      });

      if (response.ok) {
        // If successful, update the time left for the new token
        const newAuthState = await response.json();
        setTimeLeft(Math.max(0, Math.floor(newAuthState.expires_in))); // Reset timer with new expiry time
        Alert.alert('Token Refreshed', 'Token timer has been reset');
      } else {
        Alert.alert('Error', 'Failed to refresh token');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to refresh token: ${error.message}`);
    }
  };

  // Function to display user permissions
  // This function will display the associated roles for the user in the message state
  const handlePermissionsPress = () => {
    setMessage(`User roles associated with the client:\n${associatedRoles}`);
  };

  // Function to display user role
  // This function will display the user's role in the message state
  const handleRolePress = () => {
    setMessage(`User role: ${userRole}`);
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
              onPress={() => navigation.navigate('Admin', { authStateString: JSON.stringify(authState), userRole })}
            />
          </View>
        )}
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