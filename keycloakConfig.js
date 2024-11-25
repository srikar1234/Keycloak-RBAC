const keycloakConfig = {
  issuer: 'https://identity-dev.kshema.co/realms/keycloak-kshema',
  clientId: 'Client-1-Demo',
  redirectUrl: 'simpleapp://callback',
  clientSecret: '50ZiqowBj3FoAg3fMJgo3lWtAAvQAvhd',
  scopes: ['openid', 'profile'],
  baseurl: 'https://identity-dev.kshema.co',
  realm: 'realms/keycloak-kshema',
  realmName: 'keycloak-kshema',
  secret: 'KshemaGeneralInsurance',
};

export default keycloakConfig;