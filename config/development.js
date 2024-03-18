module.exports = {
  name: "Todo List API - development",
  stack: true,
  accessTokenTtl: 5 * 60, // 5min
  origin: "http://localhost:3000",
  jwtPrivateKey: "1234",
  google: {
    redirectUri: "http://localhost:3001/api/users/oauth/google",
  },
};
