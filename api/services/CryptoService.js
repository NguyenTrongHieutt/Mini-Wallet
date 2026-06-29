var crypto = require('crypto');

module.exports = {
  hashSecret: function(secret) {
    var salt = crypto.randomBytes(16).toString('hex');
    var hash = crypto.pbkdf2Sync(String(secret), salt, 10000, 64, 'sha512').toString('hex');
    return salt + ':' + hash;
  },

  verifySecret: function(secret, stored) {
    if (!secret || !stored || stored.indexOf(':') === -1) {
      return false;
    }

    var parts = stored.split(':');
    var salt = parts[0];
    var expected = parts[1];
    var actual = crypto.pbkdf2Sync(String(secret), salt, 10000, 64, 'sha512').toString('hex');
    return actual === expected;
  },

  createToken: function() {
    return crypto.randomBytes(32).toString('hex');
  },

  hashToken: function(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
  },

  checksumPocket: function(pocket) {
    return crypto
      .createHash('sha256')
      .update([pocket.ownerType, pocket.ownerId, pocket.currency, pocket.balance].join('|'))
      .digest('hex');
  }
};
