const keycloakConfig = {
  issuer: 'https://identity-dev.kshema.co/realms/React-native-application-test',
  clientId: 'test_client',
  redirectUrl: 'simpleapp://callback',
  clientSecret: 'lMj9UVLT2e63PoWLcTsbKwaLZG0ex45D',
  scopes: ['openid', 'profile'],
};

export default keycloakConfig;