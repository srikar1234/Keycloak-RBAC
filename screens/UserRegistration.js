// screens/UserRegistrationScreen.js
import React, { useState } from 'react';
import { View, Button, Alert, Text, TextInput, StyleSheet } from 'react-native';
import CryptoJS from 'react-native-crypto-js';

import { authorize } from 'react-native-app-auth';
import { useNavigation } from '@react-navigation/native';
import keycloakConfig from '../keycloakConfig.js'; // Ensure the keycloakConfig is properly set

function UserRegistrationScreen() {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleLogin = async () => {
    try {
      const authState = await authorize(keycloakConfig);
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
  
  const generatePasswordHash = (email, secret) => {
    try {
      return CryptoJS.AES.encrypt(email, secret).toString();
    } catch (error) {
      console.error('Error generating password hash:', error);
      throw new Error('Failed to generate password hash');
    }
  };

  const getAdminAccessToken = async (keycloakConfig) => {
    try {
      const response = await fetch(`${keycloakConfig.baseurl}/${keycloakConfig.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
        }).toString(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      } else {
        const errorDetail = await response.text();
        throw new Error('Failed to get admin access token: ' + errorDetail);
      }
    } catch (error) {
      console.error('Error fetching admin access token:', error);
      throw error;
    }
  };

  const handleRegisterUser = async (keycloakConfig) => {
    try {
      const adminAccessToken = await getAdminAccessToken(keycloakConfig);
      const endpointUrl = `${keycloakConfig.baseurl}/admin/${keycloakConfig.realm}/users`;
      const userName = phoneNumber;
      const emailId = `${userName}@kshema.co`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          username: userName,
          enabled: true,
          emailVerified: true,
          firstName: firstName,
          lastName: lastName,
          email: emailId,
          credentials: [
            {
              type: 'password',
              value: generatePasswordHash(emailId, `${keycloakConfig.secret}`),
              temporary: false,
            },
          ],
          attributes: {
            'clientRoleMappings': JSON.stringify({
              [keycloakConfig.clientId]: ['User-Client'],
            }),
          },
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'User created successfully');
      } else {
        const errorDetail = await response.text();
        Alert.alert('Error', `Failed to create user: ${errorDetail}`);
        throw new Error(`Failed to create user: ${errorDetail}`);
      }
    } catch (error) {
      console.error('Error during user registration process:', error);
      throw error;
    }
  };

  const handleUserRegistrationPress = async () => {
    try {
      await handleRegisterUser(keycloakConfig);
      handleLogin();
    } catch (error) {
      console.error('User registration failed:', error);
      Alert.alert('Registration Failed', `User registration failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Text style={styles.label}>Phone Number:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.label}>First Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter first name"
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.label}>Last Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter last name"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <Button title="Register" onPress={handleUserRegistrationPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    width: 100,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});

export default UserRegistrationScreen;