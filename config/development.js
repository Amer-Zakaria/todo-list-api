module.exports = {
  name: "Todo List API - development",
  stack: true,
  accessTokenTtl: 5 * 60, // 5min
  origin: "http://localhost:3000/todo-list",
  jwtPrivateKey: "1234",
};
