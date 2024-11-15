const keycloakConfig = {
  issuer: 'https://identity-dev.kshema.co/realms/keycloak-kshema',
  clientId: 'react_native_client',
  redirectUrl: 'simpleapp://callback',
  clientSecret: 'j3pik5w3fgk3K9nul3iq8WdHkN6NAooM',
  scopes: ['openid', 'profile'],
  baseurl: 'https://identity-dev.kshema.co',
  realm: 'realms/keycloak-kshema',
  realmName: 'keycloak-kshema',
  secret: 'KshemaGeneralInsurance',
};

export default keycloakConfig;