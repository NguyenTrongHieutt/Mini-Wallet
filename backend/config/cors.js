var cors = require("./miniWallet").miniWallet.cors;

module.exports.cors = {
  allRoutes: true,
  origin: cors.origins,
  credentials: true,
  methods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  headers: 'content-type, authorization, x-requested-with'
};
