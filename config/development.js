module.exports = {
  name: "Todo List API - development",
  stack: true,
  accessTokenTtl: "2m",
  emailVerification: {
    tokenTtl: "1m",
  },
  resetPass: {
    tokenTtl: "1m",
  },
  origin: "http://localhost:3000",
  apiOrigin: "http://localhost:3001",
  jwtPrivateKey: "1234",
  refreshJwtPrivateKey: "12345",
  google: {
    redirectUri: "http://localhost:3001/api/users/oauth/google",
  },
};
