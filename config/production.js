module.exports = {
  name: "Todo List API - production",
  accessTokenTtl: 1 * 60 * 60, //1h
  origin: "https://todo-list-ui.netlify.app",
  apiOrigin: "https://todo-list-api-ml1b.onrender.com",
  stack: false,
  google: {
    redirectUri:
      "https://todo-list-api-ml1b.onrender.com/api/users/oauth/google",
  },
};
