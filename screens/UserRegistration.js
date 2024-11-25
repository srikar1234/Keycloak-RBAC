import React, { useState } from 'react';
import { View, Button, Alert, Text, TextInput, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import CryptoJS from 'react-native-crypto-js';
import { useNavigation } from '@react-navigation/native';
import keycloakConfig from '../keycloakConfig';

function UserRegistrationScreen() {
  const navigation = useNavigation();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [open, setOpen] = useState(false);

  const [groups, setGroups] = useState([
    { label: 'Admin', value: 'Admin' },
    { label: 'User', value: 'User' },
    { label: 'POSP/Field Survey Agents', value: 'POSP' },
    { label: 'Guest', value: 'Guest' },
    {label: 'Unrecognized group', value: 'No Group'}
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

      const isEnabled = !(selectedGroup === 'Guest Group' || selectedGroup === 'POSP Group');

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

  // Helper to fetch group ID
  const fetchGroupId = async (adminAccessToken, groupName) => {
    try {
      console.log(`Fetching group ID for group: ${groupName}`);
      const response = await fetch(
        `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/groups`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error('Failed to fetch groups:', errorDetail);
        throw new Error('Failed to fetch groups');
      }

      const groups = await response.json();
      const group = groups.find((g) => g.name === groupName);

      if (!group) {
        console.error('Group not found');
        throw new Error('Group not found');
      }

      console.log('Group ID fetched successfully');
      return group.id;
    } catch (error) {
      console.error('Error fetching group ID:', error);
      throw error;
    }
  };

  // Helper to assign a user to a group
  const assignUserToGroup = async (adminAccessToken, userId, groupId) => {
    try {
      console.log('Assigning user to group...');
      const response = await fetch(
        `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/users/${userId}/groups/${groupId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error('Failed to assign user to group:', errorDetail);
        throw new Error(`Failed to assign user to group: ${errorDetail}`);
      }

      console.log('User assigned to group successfully');
    } catch (error) {
      console.error('Error assigning user to group:', error);
      throw error;
    }
  };

  // Main function to handle user registration
 // Main function to handle user registration
 const handleUserRegistrationPress = async () => {
   if (!selectedGroup) {
     Alert.alert('Validation Error', 'Please select a group before proceeding');
     return;
   }

   let adminAccessToken = null;
   let userId = null;

   try {
     console.log('Starting user registration process...');
     // Fetch admin access token
     adminAccessToken = await getAdminAccessToken();

     // Create user and fetch their ID
     await createUser(adminAccessToken);
     userId = await fetchUserId(adminAccessToken, phoneNumber);

     // Fetch group ID
     const groupId = await fetchGroupId(adminAccessToken, selectedGroup);

     // Assign user to the group
     await assignUserToGroup(adminAccessToken, userId, groupId);

     Alert.alert('Success', 'User created and mapped to the group successfully');
     console.log('User registration process completed successfully');
     navigation.navigate('Login');
   } catch (error) {
     console.error('Error during user registration process:', error);

     // If an error occurs after user creation, delete the user from Keycloak
     if (userId && adminAccessToken) {
       console.log('Attempting to delete the user due to error...');
       await deleteUser(adminAccessToken, userId);
     }

     Alert.alert('Error', error.message);
   }
 };

 // Helper to delete user
 const deleteUser = async (adminAccessToken, userId) => {
   try {
     console.log(`Deleting user with ID: ${userId}`);
     const response = await fetch(
       `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/users/${userId}`,
       {
         method: 'DELETE',
         headers: {
           Authorization: `Bearer ${adminAccessToken}`,
         },
       }
     );

     if (!response.ok) {
       const errorDetail = await response.text();
       console.error('Failed to delete user:', errorDetail);
       throw new Error('Failed to delete user');
     }

     console.log('User deleted successfully');
   } catch (error) {
     console.error('Error deleting user:', error);
     throw error; // Propagate the error for logging or further handling
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
        <Text style={styles.label}>Select Group:</Text>
        <DropDownPicker
          open={open}
          value={selectedGroup}
          items={groups}
          setOpen={setOpen}
          setValue={setSelectedGroup}
          setItems={setGroups}
          placeholder="Select Group"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
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