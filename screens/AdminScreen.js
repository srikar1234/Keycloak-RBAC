// screens/AdminScreen.js
import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import styles from '../styles/style.js';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logoutUser } from './LogoutUser.js';

function AdminScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // Parsing the authState string to convert it back to an object for use
  const authState = JSON.parse(route.params?.authStateString);
  const refreshToken = authState?.refreshToken;

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
      <Text>Admin Screen</Text>
      <Button
        title="Logout"
        onPress={handleLogout}
      />
    </View>
  );
}

export default AdminScreen;