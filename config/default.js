module.exports = {
  name: "Todo List API",
  port: 3000,
  jwtPrivateKey: "",
  accessTokenTtl: 15 * 60, //15min
  origin: "http://localhost:3000",
  mailer: {
    email: "amerzkfe1234@gmail.com",
    emailPass: "",
  },
  db: {
    uri: "",
  },
  google: {
    redirectUri: "http://localhost:3001/api/users/oauth/google",
    clientId: "",
    clientSecret: "",
  },
};
