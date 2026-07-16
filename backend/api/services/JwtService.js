const jwt = require('jsonwebtoken');

module.exports = {
  sign: function(payload) {
    const auth = MiniWalletConfigService.auth();
    return jwt.sign(payload, this.secret(), {
      expiresIn: auth.tokenTtlSeconds
    });
  },

  verify: function(token) {
    return jwt.verify(token, this.secret());
  },

  secret: function() {
    return MiniWalletConfigService.auth().jwtSecret;
  }
};
