module.exports = {
  name: "Todo List API",
  port: 3001,
  jwtPrivateKey: "",
  refreshJwtPrivateKey: "",
  hitTheServerEvery: "*/14 * * * *", //14min since the server spins down every 15min
  accessTokenTtl: 15 * 60, //15min
  emailVerification: {
    jwtPrivateKey: "123456",
    tokenTtl: "30m",
    errorPathName: "email-validation-error",
  },
  resetPass: {
    jwtPrivateKey: "1234567",
    tokenTtl: "30m",
  },
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
    redirectUri: "http://localhost:3001/api/oauth/google",
    clientId: "",
    clientSecret: "",
    errorPathName: "google-error",
  },
};
