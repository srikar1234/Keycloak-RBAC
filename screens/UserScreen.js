// screens/UserScreen.js
import React, { useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import styles from '../styles/style.js';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logoutUser } from './LogoutUser.js';

function UserScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // Parsing the authState string to convert it back to an object for use
  const authState = JSON.parse(route.params?.authStateString);
  const refreshToken = authState?.refreshToken;

  useEffect(() => {
    console.log('User authenticated successfully');
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser(refreshToken);
      Alert.alert('Logout Successful', 'User has been logged out');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text>User Screen</Text>
      <Button
        title="Go to Admin Screen"
        // Passing authState as a string to ensure consistent handling across screens
        onPress={() => navigation.navigate('Admin', { authStateString: JSON.stringify(authState) })}
      />
      <Button
        title="Logout"
        onPress={handleLogout}
      />
    </View>
  );
}

export default UserScreen;
