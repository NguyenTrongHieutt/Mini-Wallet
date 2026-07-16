/**
 * Owns the raw MongoDB operations used by the transaction ledger.
 *
 * RuntimeProcessService keeps the business flow, while this repository keeps
 * driver-specific details (collection names, ObjectIds, sessions and
 * findOneAndUpdate options) in one place.
 */

var DOMAIN = require("../../config/domain").domain;

module.exports = {
  create: function (connection) {
    if (!connection || !connection.collections || !connection.session) {
      throw new Error("LEDGER_REPOSITORY_CONNECTION_REQUIRED");
    }

    return {
      findPocket: function (pocketId) {
        return findPocket(connection, pocketId);
      },
      debitPocket: function (pocket, amount) {
        return updatePocketBalance(connection, pocket, -amount, {
          balance: { $gte: amount },
        });
      },
      creditPocket: function (pocket, amount) {
        return updatePocketBalance(connection, pocket, amount);
      },
      insertPocketEntry: function (entry) {
        return insertPocketEntry(connection, entry);
      },
      insertTransaction: function (transaction) {
        return insertTransaction(connection, transaction);
      },
      completeTrail: function (trailId, transBody, updatedBy) {
        return completeTrail(
          connection,
          trailId,
          transBody,
          updatedBy,
        );
      },
    };
  },
};

async function findPocket(connection, pocketId) {
  const pocket = await connection.collections.pockets.findOne(
    { _id: connection.toObjectId(pocketId) },
    { session: connection.session },
  );

  return connection.normalizeId(pocket);
}

async function updatePocketBalance(connection, pocket, amountDelta, criteria) {
  const query = Object.assign(
    {
      _id: connection.toObjectId(pocket.id),
      status: pocket.status,
    },
    criteria || {},
  );
  const updated = await connection.collections.pockets.findOneAndUpdate(
    query,
    {
      $inc: { balance: amountDelta },
      $set: { updatedBy: "engine", updatedAt: new Date() },
    },
    { returnOriginal: false, session: connection.session },
  );

  if (!updated || !updated.value) {
    return null;
  }

  const updatedPocket = connection.normalizeId(updated.value);
  const checksum = CryptoService.checksumPocket({
    ownerType: updatedPocket.ownerType,
    ownerId: updatedPocket.ownerId,
    currency: updatedPocket.currency,
    balance: updatedPocket.balance,
  });
  const checksumResult = await connection.collections.pockets.updateOne(
    {
      _id: connection.toObjectId(updatedPocket.id),
      balance: updatedPocket.balance,
    },
    { $set: { checksum: checksum, updatedAt: new Date() } },
    { session: connection.session },
  );

  if (getMatchedCount(checksumResult) !== 1) {
    return null;
  }

  updatedPocket.checksum = checksum;
  return updatedPocket;
}

async function insertPocketEntry(connection, entry) {
  const persisted = Object.assign({}, entry, {
    transRefId: connection.toObjectId(entry.transRefId),
    debitPocketId: connection.toObjectId(entry.debitPocketId),
    creditPocketId: connection.toObjectId(entry.creditPocketId),
    currency: connection.toObjectId(entry.currency),
  });
  const inserted = await connection.collections.pocketEntries.insertOne(
    persisted,
    { session: connection.session },
  );

  persisted._id = inserted.insertedId;
  return connection.normalizeId(persisted);
}

async function insertTransaction(connection, transaction) {
  const persisted = Object.assign({}, transaction, {
    transRefId: connection.toObjectId(transaction.transRefId),
    senderCustomer: optionalObjectId(
      connection,
      transaction.senderCustomer,
    ),
    receiverCustomer: optionalObjectId(
      connection,
      transaction.receiverCustomer,
    ),
    receiverProvider: optionalObjectId(
      connection,
      transaction.receiverProvider,
    ),
    currency: connection.toObjectId(transaction.currency),
  });
  const inserted = await connection.collections.transactions.insertOne(
    persisted,
    { session: connection.session },
  );

  persisted._id = inserted.insertedId;
  return connection.normalizeId(persisted);
}

async function completeTrail(connection, trailId, transBody, updatedBy) {
  const updated = await connection.collections.trails.findOneAndUpdate(
    {
      _id: connection.toObjectId(trailId),
      status: DOMAIN.status.PENDING,
    },
    {
      $set: {
        outputMessage: { TRANSBODY: transBody },
        status: DOMAIN.status.DONE,
        updatedBy: updatedBy,
        updatedAt: new Date(),
      },
    },
    { returnOriginal: false, session: connection.session },
  );

  return updated && updated.value
    ? connection.normalizeId(updated.value)
    : null;
}

function optionalObjectId(connection, value) {
  return value ? connection.toObjectId(value) : undefined;
}

function getMatchedCount(result) {
  if (!result) {
    return 0;
  }

  if (result.matchedCount !== undefined) {
    return result.matchedCount;
  }

  if (result.result && result.result.n !== undefined) {
    return result.result.n;
  }

  return result.n || 0;
}
