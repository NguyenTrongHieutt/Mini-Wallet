const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

let client;

module.exports = {
  getConnection: async function () {
    const db = await getDb();
    return {
      client: client,
      db: db,
      collections: getLedgerCollections(db),
      toObjectId: toObjectId,
      normalizeId: normalizeId,
    };
  },
};

async function getDb() {
  if (!client) {
    client = await MongoClient.connect(getMongoUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  return client.db(getMongoDatabase());
}

function getLedgerCollections(db) {
  return {
    pockets: db.collection("pocket"),
    pocketEntries: db.collection("pocketentry"),
    transactions: db.collection("transaction"),
    trails: db.collection("transactiontrail"),
  };
}

function getMongoUri() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const connection =
    typeof sails !== "undefined" &&
    sails &&
    sails.config &&
    sails.config.connections &&
    sails.config.connections.mongo;
  const host = process.env.MONGO_HOST || (connection && connection.host) || "127.0.0.1";
  const port = process.env.MONGO_PORT || (connection && connection.port) || 27017;
  const database = getMongoDatabase();

  return "mongodb://" + host + ":" + port + "/" + database;
}

function getMongoDatabase() {
  const connection =
    typeof sails !== "undefined" &&
    sails &&
    sails.config &&
    sails.config.connections &&
    sails.config.connections.mongo;

  return process.env.MONGO_DATABASE || (connection && connection.database) || "mini_wallet";
}

function toObjectId(value) {
  if (value instanceof ObjectId) {
    return value;
  }

  if (ObjectId.isValid(value)) {
    return new ObjectId(String(value));
  }

  return value;
}

function normalizeId(doc) {
  if (!doc) {
    return doc;
  }

  doc.id = String(doc._id || doc.id);
  return doc;
}
