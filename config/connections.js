/**
 * Connections
 * (sails.config.connections)
 */

module.exports.connections = {
  mongo: {
    adapter: 'sails-mongo',
    host: process.env.MONGO_HOST || 'localhost',
    port: process.env.MONGO_PORT || 27017,
    database: process.env.MONGO_DATABASE || 'mini_wallet'
  }
};
