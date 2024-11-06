// logoutUser.js
import keycloakConfig from '../keycloakConfig.js';

export const logoutUser = async (refreshToken) => {
  try {
    const logoutUrl = `${keycloakConfig.issuer}/protocol/openid-connect/logout`;
    const params = new URLSearchParams();
    params.append('client_id', keycloakConfig.clientId);
    params.append('client_secret', keycloakConfig.clientSecret);
    params.append('refresh_token', refreshToken); // Use refresh token to logout

    const response = await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (response.ok) {
      console.log('User logged out successfully');
    } else {
      console.log('Failed to log out:', response.statusText);
    }
  } catch (error) {
    console.log('Error logging out:', error);
  }
};