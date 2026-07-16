"use strict";

var assert = require("assert");
var path = require("path");

var repositoryPath = path.resolve(
  __dirname,
  "../../api/services/LedgerRepositoryService.js",
);

module.exports = [
  {
    name: "persists checksum calculated from the after-update pocket balance",
    run: async function () {
      var previousCryptoService = global.CryptoService;
      var findOptions;
      var checksumUpdate;
      global.CryptoService = {
        checksumPocket: function (pocket) {
          return [
            pocket.ownerType,
            pocket.ownerId,
            pocket.currency,
            pocket.balance,
          ].join("|");
        },
      };

      try {
        delete require.cache[repositoryPath];
        var repositoryService = require(repositoryPath);
        var repository = repositoryService.create({
          session: { id: "session" },
          toObjectId: function (value) {
            return value;
          },
          normalizeId: function (doc) {
            if (doc) doc.id = String(doc._id || doc.id);
            return doc;
          },
          collections: {
            pockets: {
              findOneAndUpdate: function (query, update, options) {
                findOptions = options;
                assert.deepStrictEqual(query.balance, { $gte: 25 });
                assert.strictEqual(update.$inc.balance, -25);
                return Promise.resolve({
                  value: {
                    _id: "pocket-1",
                    ownerType: "customer",
                    ownerId: "customer-1",
                    currency: "currency-1",
                    status: "locked",
                    balance: 75,
                    checksum: "old",
                  },
                });
              },
              updateOne: function (query, update, options) {
                checksumUpdate = {
                  query: query,
                  update: update,
                  options: options,
                };
                return Promise.resolve({ matchedCount: 1 });
              },
            },
          },
        });

        var updated = await repository.debitPocket(
          { id: "pocket-1", status: "locked" },
          25,
        );

        assert.strictEqual(findOptions.returnOriginal, false);
        assert.strictEqual(findOptions.session.id, "session");
        assert.strictEqual(checksumUpdate.query.balance, 75);
        assert.strictEqual(
          checksumUpdate.update.$set.checksum,
          "customer|customer-1|currency-1|75",
        );
        assert.strictEqual(
          updated.checksum,
          "customer|customer-1|currency-1|75",
        );
      } finally {
        global.CryptoService = previousCryptoService;
      }
    },
  },
];
