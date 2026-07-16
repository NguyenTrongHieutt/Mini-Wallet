const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

let client;

module.exports = {
  getConnection: async function () {
    return createConnection();
  },

  withTransaction: async function (work) {
    const connection = await createConnection();
    const session = connection.client.startSession();
    connection.session = session;
    let result;

    try {
      await session.withTransaction(async function () {
        result = await work(connection);
      });
      return result;
    } finally {
      await session.endSession();
    }
  },

  isTransactionUnavailable: function (err) {
    if (!err) {
      return false;
    }

    const message = err.message || "";
    return (
      message.indexOf("Transaction numbers are only allowed") !== -1 ||
      message.indexOf("replica set member or mongos") !== -1 ||
      message.indexOf("Transaction is not supported") !== -1
    );
  },

  close: async function () {
    if (!client) {
      return;
    }

    var currentClient = client;
    client = null;
    await currentClient.close();
  },
};

async function createConnection() {
  const db = await getDb();
  return {
    client: client,
    db: db,
    collections: getLedgerCollections(db),
    toObjectId: toObjectId,
    normalizeId: normalizeId,
  };
}

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
  const databaseConfig = MiniWalletConfigService.get().database;
  if (databaseConfig.uri) {
    return databaseConfig.uri;
  }

  return (
    "mongodb://" +
    databaseConfig.host +
    ":" +
    databaseConfig.port +
    "/" +
    databaseConfig.name
  );
}

function getMongoDatabase() {
  return MiniWalletConfigService.get().database.name;
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
