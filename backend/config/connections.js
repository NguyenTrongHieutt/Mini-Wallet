/**
 * Connections
 * (sails.config.connections)
 */

var database = require("./miniWallet").miniWallet.database;

module.exports.connections = {
  mongo: {
    adapter: 'sails-mongo',
    url: database.uri || undefined,
    host: database.host,
    port: database.port,
    database: database.name
  }
};
