const keycloakConfig = {
  issuer: 'https://identity-dev.kshema.co/realms/keycloak-kshema',
  clientId: 'Client - 2 Demo',
  redirectUrl: 'simpleapp://callback',
  clientSecret: 'Ar9IWf51ZSDOruRQGrHtcBhVnghzNtag',
  scopes: ['openid', 'profile'],
  baseurl: 'https://identity-dev.kshema.co',
  realm: 'realms/keycloak-kshema',
  realmName: 'keycloak-kshema',
  secret: 'KshemaGeneralInsurance',
};

export default keycloakConfig;