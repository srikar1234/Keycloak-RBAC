import React, { useState } from 'react';
import { View, Button, Alert, Text, TextInput, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import CryptoJS from 'react-native-crypto-js';
import { useNavigation } from '@react-navigation/native';
import keycloakConfig from '../keycloakConfig';
import { authorize } from 'react-native-app-auth';
function UserRegistrationScreen() {

  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [open, setOpen] = useState(false);

  const [roles, setRoles] = useState([
    { label: 'Admin', value: 'Admin-Client' },
    { label: 'User', value: 'User-Client' },
    { label: 'POSP/POSPM/Field Survey Agents', value: 'POSP' },
    { label: 'Guest', value: 'Guest' },
  ]);

  // Helper to get admin access token
  const getAdminAccessToken = async () => {
    try {
      console.log('Fetching admin access token...');
      const response = await fetch(
        `${keycloakConfig.baseurl}/realms/${keycloakConfig.realmName}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: keycloakConfig.clientId,
            client_secret: keycloakConfig.clientSecret,
          }).toString(),
        }
      );

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error('Failed to get admin access token:', errorDetail);
        throw new Error('Failed to get admin access token');
      }

      const { access_token } = await response.json();
      console.log('Admin access token fetched successfully');
      return access_token;
    } catch (error) {
      console.error('Error fetching admin access token:', error);
      throw error;
    }
  };

  // Helper to create user
  const createUser = async (adminAccessToken) => {
    try {
      console.log('Creating user...');
      const userName = phoneNumber;
      const emailId = `${userName}@kshema.co`;

      // Set enabled to false for "Guest" or "POSP" roles
      const isEnabled = !(selectedRole === 'Guest' || selectedRole === 'POSP');

      const response = await fetch(
        `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify({
            username: userName,
            enabled: isEnabled,
            emailVerified: true,
            firstName: firstName,
            lastName: lastName,
            email: emailId,
            credentials: [
              {
                type: 'password',
                value: CryptoJS.AES.encrypt(emailId, keycloakConfig.secret).toString(),
                temporary: false,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error('Failed to create user:', errorDetail);
        throw new Error(`Failed to create user: ${errorDetail}`);
      }

      console.log('User created successfully');
      return emailId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  // Helper to fetch user by username
  const fetchUserId = async (adminAccessToken, username) => {
    try {
      console.log(`Fetching user ID for username: ${username}`);
      const response = await fetch(
        `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/users?username=${username}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error('Failed to fetch user:', errorDetail);
        throw new Error('Failed to fetch user');
      }

      const users = await response.json();
      const user = users.find((u) => u.username === username);

      if (!user) {
        console.error('User not found');
        throw new Error('User not found');
      }

      console.log('User ID fetched successfully');
      return user.id;
    } catch (error) {
      console.error('Error fetching user ID:', error);
      throw error;
    }
  };

  // Helper to fetch client ID
  const fetchClientId = async (adminAccessToken) => {
    try {
      console.log('Fetching client ID...');
      const response = await fetch(
        `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/clients`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error('Failed to fetch clients:', errorDetail);
        throw new Error('Failed to fetch clients');
      }

      const clients = await response.json();
      const client = clients.find((c) => c.clientId === keycloakConfig.clientId);

      if (!client) {
        console.error('Client not found');
        throw new Error('Client not found');
      }

      console.log('Client ID fetched successfully');
      return client.id;
    } catch (error) {
      console.error('Error fetching client ID:', error);
      throw error;
    }
  };

  // Helper to fetch role ID for a client
  const fetchRoleId = async (adminAccessToken, clientId, roleName) => {
    try {
      console.log(`Fetching role ID for role: ${roleName}`);
      const response = await fetch(
        `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/clients/${clientId}/roles`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error('Failed to fetch roles:', errorDetail);
        throw new Error('Failed to fetch roles');
      }

      const roles = await response.json();
      const role = roles.find((r) => r.name === roleName);

      if (!role) {
        console.error('Role not found');
        throw new Error('Role not found');
      }

      console.log('Role ID fetched successfully');
      return role;
    } catch (error) {
      console.error('Error fetching role ID:', error);
      throw error;
    }
  };

  // Helper to assign a role to a user
  const assignClientRole = async (adminAccessToken, userId, clientId, role) => {
    try {
      console.log('Assigning client role...');
      const response = await fetch(
        `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/users/${userId}/role-mappings/clients/${clientId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify([role]),
        }
      );

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error('Failed to assign role:', errorDetail);
        throw new Error(`Failed to assign role: ${errorDetail}`);
      }

      console.log('Role assigned successfully');
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  };

  // Main function to handle user registration
  const handleUserRegistrationPress = async () => {
    if (!selectedRole) {
      Alert.alert('Validation Error', 'Please select a role before proceeding');
      return;
    }

    try {
      console.log('Starting user registration process...');
      const adminAccessToken = await getAdminAccessToken();
      await createUser(adminAccessToken);
      const userId = await fetchUserId(adminAccessToken, phoneNumber);
      const clientId = await fetchClientId(adminAccessToken);
      const role = await fetchRoleId(adminAccessToken, clientId, selectedRole);

      await assignClientRole(adminAccessToken, userId, clientId, role);

      Alert.alert('Success', 'User created and role assigned successfully');
      console.log('User registration process completed successfully');
      handleLogin();
    } catch (error) {
      console.error('Error during user registration process:', error);
      Alert.alert('Error', error.message);
    }
  };

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

      <View style={styles.inputRow}>
        <Text style={styles.label}>Select Role:</Text>
        <DropDownPicker
          open={open}
          value={selectedRole}
          items={roles}
          setOpen={setOpen}
          setValue={setSelectedRole}
          setItems={setRoles}
          placeholder=""
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          listMode="SCROLLVIEW" // Ensures proper scrolling if there are many options
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Register" onPress={handleUserRegistrationPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    width: 120,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 5,
    backgroundColor: '#fff',
  },
  dropdown: {
    flex: 1,
    height: 50,
    width: 250,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 30,
    width: '100%',
  },
});

export default UserRegistrationScreen;