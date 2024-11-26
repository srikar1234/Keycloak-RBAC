import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import styles from '../styles/style.js';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logoutUser } from './LogoutUser.js';
import keycloakConfig from '../keycloakConfig.js';

function AdminScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userRole = route.params?.userRole
  const [authState, setAuthState] = useState(() => JSON.parse(route.params?.authStateString)); // Default authState
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const AT = authState.accessToken || authState.access_token;
    const tokenPayload = JSON.parse(atob(AT.split('.')[1]));

    // Calculate initial time left
    const expiryTime = tokenPayload.exp * 1000 - Date.now();
    setTimeLeft(Math.max(0, Math.floor(expiryTime / 1000)));

    // Timer for token expiration
    const timer = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        if (prevTimeLeft <= 1) {
          clearInterval(timer);
          handleLogout();
          return 0;
        }
        return prevTimeLeft - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [authState]);

   const handleGoBackToUserScreen = () => {
       navigation.navigate('User', {
         authStateString: JSON.stringify(authState),
         userRole,
       });
     };

  // Logout Function
  const handleLogout = async () => {
    try {
      const currentRefreshToken = authState.refreshToken || authState.refresh_token;
      await logoutUser(currentRefreshToken);
      Alert.alert('Logout Successful', 'Admin has been logged out');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  // Refresh Token Function
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
        sendAuthStateToUserScreen(newAuthState); // Call the new function to send authState back
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
  
  // Function to send updated authState to UserScreen
  const sendAuthStateToUserScreen = (updatedAuthState) => {
    navigation.setParams({
      authStateString: JSON.stringify(updatedAuthState),
    });
  };
  
// Show Access Token
const handleShowAccessToken = () => {
  const currentAccessToken = authState.accessToken || authState.access_token;
  setMessage(`Access Token:\n${currentAccessToken}`);
};

// Show Disabled Users
const handleShowDisabledUsers = async () => {
  const currentAccessToken = authState.accessToken || authState.access_token;

  try {
    console.log('Fetching disabled users...');
    const users = await fetchAllUsers(currentAccessToken);
    const disabledUsers = users.filter((user) => !user.enabled).map((user) => user.username);
    displayResults('Disabled Users', disabledUsers);
  } catch (error) {
    Alert.alert('Error', `Failed to fetch disabled users: ${error.message}`);
  }
};

// Show Guest Users
const handleShowGuestUsers = async () => {
  const currentAccessToken = authState.accessToken || authState.access_token;

  try {
    console.log('Fetching guest users...');
    const users = await fetchAllUsers(currentAccessToken);
    const guestUsers = await filterUsersByGroup(users, 'Guest', currentAccessToken);
    displayResults('Guest Users', guestUsers);
  } catch (error) {
    Alert.alert('Error', `Failed to fetch guest users: ${error.message}`);
  }
};

// Show Pending Approvals
const handleShowPendingApprovals = async () => {
  const currentAccessToken = authState.accessToken || authState.access_token;

  try {
    console.log('Fetching pending approvals...');
    const users = await fetchAllUsers(currentAccessToken);
    const pendingApprovals = await filterUsersByGroup(
      users,
      'POSP',
      currentAccessToken,
      (user) => !user.enabled // Additional filter: user is disabled
    );
    displayResults('Pending Approvals', pendingApprovals);
  } catch (error) {
    Alert.alert('Error', `Failed to fetch pending approvals: ${error.message}`);
  }
};

// Utility to fetch all users
const fetchAllUsers = async (accessToken) => {
  try {
    const response = await fetch(
      `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/users?enabled=false`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error('Failed to fetch users:', errorDetail);
      throw new Error('Failed to fetch users');
    }

    return await response.json(); // Return parsed users
  } catch (error) {
    console.error('Error fetching all users:', error.message);
    throw error;
  }
};

// Function to filter users based on a group
const filterUsersByGroup = async (users, groupName, accessToken, additionalFilter) => {
  const filteredUsers = [];

  for (const user of users) {
    if (additionalFilter && !additionalFilter(user)) {
      continue; // Skip if the user does not satisfy the additional filter
    }

    // Fetch groups for the user
    const groups = await fetchUserGroups(user.id, accessToken);

    // Check if the user belongs to the specified group
    const isInGroup = groups.some((group) => group.name === groupName);

    if (isInGroup) {
      console.log(`User: ${user.username}`);
      console.log(`Groups: ${groups.map((group) => group.name).join(', ')}`);

      filteredUsers.push(user.username);
    }
  }

  return filteredUsers;
};

// Helper function to fetch groups for a user
const fetchUserGroups = async (userId, accessToken) => {
  try {
    const response = await fetch(
      `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/users/${userId}/groups`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch groups for user: ${userId}`);
      return [];
    }

    return await response.json(); // Return user groups
  } catch (error) {
    console.error(`Error fetching groups for user ${userId}:`, error.message);
    return [];
  }
};


// Utility to display results
const displayResults = (title, usernames) => {
  if (usernames.length > 0) {
    console.log(`${title} fetched successfully:`, usernames);
    setMessage(`${title}:\n${usernames.join('\n')}`);
  } else {
    console.log(`No ${title.toLowerCase()} found.`);
    setMessage(`No ${title.toLowerCase()} found.`);
  }
};
const handlePOSPApproval = async () => {
  const currentAccessToken = authState.accessToken || authState.access_token;

  try {
    console.log('Fetching pending POSP users for approval...');

    // Step 1: Fetch all users
    const users = await fetchAllUsers(currentAccessToken);

    // Step 2: Filter users with `enabled = false`
    const disabledUsers = users.filter((user) => !user.enabled);

    // Step 3: Check for "POSP" client role
    const pospUsers = await filterUsersByGroup(
      disabledUsers,
      'POSP',
      currentAccessToken
    );

    if (pospUsers.length === 0) {
      console.log('No POSP users found for approval.');
      setMessage('No POSP users found for approval.');
      return;
    }

    const approvedUsers = [];

    // Step 4: Prompt the app user for each pending user
    for (const username of pospUsers) {
      const user = users.find((u) => u.username === username);

      if (user) {
        const approveUser = await new Promise((resolve) => {
          Alert.alert(
            'Approve User',
            `Do you want to approve the following POSP user?\n\nUsername: ${user.username}\nFirst Name: ${user.firstName || 'N/A'}\nLast Name: ${user.lastName || 'N/A'}`,
            [
              { text: 'No', onPress: () => resolve(false) },
              { text: 'Yes', onPress: () => resolve(true) },
            ]
          );
        });

        if (approveUser) {
          const updateResponse = await fetch(
            `${keycloakConfig.baseurl}/admin/realms/${keycloakConfig.realmName}/users/${user.id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${currentAccessToken}`,
              },
              body: JSON.stringify({ ...user, enabled: true }),
            }
          );

          if (updateResponse.ok) {
            console.log(`User ${username} approved successfully.`);
            approvedUsers.push(username);
          } else {
            const errorDetail = await updateResponse.text();
            console.error(`Failed to approve user ${username}:`, errorDetail);
          }
        } else {
          console.log(`User ${username} was not approved.`);
        }
      }
    }

    // Step 5: Display results
    if (approvedUsers.length > 0) {
      setMessage(`POSP Users Approved:\n${approvedUsers.join('\n')}`);
    } else {
      setMessage('No users were approved.');
    }
  } catch (error) {
    console.error('Error during POSP approval:', error.message);
    Alert.alert('Error', `Failed to approve POSP users: ${error.message}`);
  }
};
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Screen</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.timer}>Time left until token expires: {timeLeft} seconds</Text>
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <Button title="Show Access Token" onPress={handleShowAccessToken} />
        </View>
        <View style={styles.gridItem}>
          <Button title="Show Disabled Users" onPress={handleShowDisabledUsers} />
        </View>
        <View style={styles.gridItem}>
          <Button title="Show Guest Users" onPress={handleShowGuestUsers} />
        </View>
        <View style={styles.gridItem}>
          <Button title="Show Pending Approvals (POSP)" onPress={handleShowPendingApprovals} />
        </View>
        <View style={styles.gridItem}>
          <Button title="Refresh Token" onPress={handleRefreshToken} />
        </View>
        <View style={styles.gridItem}>
          <Button title="Approve POSP" onPress={handlePOSPApproval} />
        </View>
         <View style={styles.gridItem}>
                  <Button title="Go Back to User Screen" onPress={handleGoBackToUserScreen} />
                </View>
        <View style={styles.gridItem}>
          <Button title="Logout" onPress={handleLogout} />
        </View>
      </View>
    </View>
  );
}

export default AdminScreen;