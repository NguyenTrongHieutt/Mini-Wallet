var defaults = require("../../config/miniWallet").miniWallet;

module.exports = {
  get: function () {
    if (
      typeof sails !== "undefined" &&
      sails &&
      sails.config &&
      sails.config.miniWallet
    ) { 
      return sails.config.miniWallet;
    }

    return defaults;
  },

  auth: function () {
    return this.get().auth;
  },

  wallet: function () {
    return this.get().wallet;
  },

  pagination: function () {
    return this.get().pagination;
  },

  transactions: function () {
    return this.get().transactions;
  },
};
