const jwt = require('jsonwebtoken');

const DEFAULT_EXPIRES_IN = '24h';

module.exports = {
  sign: function(payload) {
    return jwt.sign(payload, this.secret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN
    });
  },

  verify: function(token) {
    return jwt.verify(token, this.secret());
  },

  secret: function() {
    return process.env.JWT_SECRET || 'mini-wallet-dev-secret';
  }
};
