module.exports = {
  name: "Todo List API",
  port: 3001,
  jwtPrivateKey: "",
  refreshJwtPrivateKey: "",
  emailVerificationJwtPrivateKey: "123456",
  hitTheServerEvery: "*/14 * * * *", //14min since the server spins down every 15min
  accessTokenTtl: 15 * 60, //15min
  emailVerificationTokenTtl: "30m",
  origin: "http://localhost:3000",
  apiOrigin: "http://localhost:3001",
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
