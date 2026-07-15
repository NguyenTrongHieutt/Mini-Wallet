/**
 * Connections
 * (sails.config.connections)
 */

module.exports.connections = {
  mongo: {
    adapter: 'sails-mongo',
    url: process.env.MONGO_URI,
    host: process.env.MONGO_HOST || '127.0.0.1',
    port: process.env.MONGO_PORT || 27017,
    database: process.env.MONGO_DATABASE || 'mini_wallet'
  }
};
