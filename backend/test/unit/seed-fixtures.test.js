"use strict";

var assert = require("assert");
var loader = require("../../scripts/lib/fixture-loader");
var operations = require("../../scripts/lib/seed-operations");
var seedRunner = require("../../scripts/lib/seed-runner");

module.exports = [
  {
    name: "loads the versioned seed manifest in deterministic order",
    run: function () {
      var manifest = loader.loadManifest();
      var selected = loader.selectSeeds(manifest);

      assert.deepStrictEqual(
        selected.map(function (entry) {
          return entry.id;
        }),
        ["currencies", "officer", "p2p", "cash-in"],
      );
      selected.forEach(function (entry) {
        if (entry.fixture) {
          assert.strictEqual(loader.loadFixture(entry.fixture).schemaVersion, 1);
        }
      });
    },
  },
  {
    name: "selects only explicitly requested compatible seed commands",
    run: function () {
      var manifest = loader.loadManifest();
      var selected = loader.selectSeeds(manifest, ["p2p"]);

      assert.strictEqual(selected.length, 1);
      assert.strictEqual(selected[0].id, "p2p");
      assert.strictEqual(selected[0].fixture, "p2p-service.v1.json");
    },
  },
  {
    name: "currency seeding is idempotent",
    run: function () {
      var model = memoryModel();
      var fixture = {
        currencies: [
          { code: "vnd", name: "Vietnamese Dong", minorUnit: 0, status: "active" },
        ],
      };

      return operations
        .currencies({ Currency: model }, fixture)
        .then(function (first) {
          assert.deepStrictEqual(first, { created: 1, updated: 0, total: 1 });
          return operations.currencies({ Currency: model }, fixture);
        })
        .then(function (second) {
          assert.deepStrictEqual(second, { created: 0, updated: 1, total: 1 });
          assert.strictEqual(model.records.length, 1);
          assert.strictEqual(model.records[0].code, "VND");
        });
    },
  },
  {
    name: "officer seed requires credentials and never returns the password",
    run: function () {
      var context = {
        Officer: memoryModel(),
        CryptoService: {
          hashSecret: function (secret) {
            return "hash:" + secret;
          },
        },
      };

      return operations
        .officer(context, { defaultDisplayName: "Officer" }, {})
        .then(function () {
          throw new Error("Expected missing credentials to fail");
        })
        .catch(function (err) {
          assert.ok(/OFFICER_PHONE is required/.test(err.message));
          return operations.officer(
            context,
            { defaultDisplayName: "Officer" },
            {
              OFFICER_PHONE: "0900000000",
              OFFICER_PASSWORD: "private-password",
            },
          );
        })
        .then(function (result) {
          assert.deepStrictEqual(result, {
            action: "created",
            phone: "0900000000",
          });
          assert.strictEqual(result.password, undefined);
          assert.strictEqual(
            context.Officer.records[0].passwordHash,
            "hash:private-password",
          );
        });
    },
  },
  {
    name: "service fixtures preserve runtime balances across repeated seeds",
    run: function () {
      var context = serviceContext();
      var fixture = loader.loadFixture("p2p-service.v1.json");

      return operations
        .service(context, fixture)
        .then(function () {
          context.Pocket.records[0].balance = 450;
          return operations.service(context, fixture);
        })
        .then(function () {
          assert.strictEqual(context.Service.records.length, 1);
          assert.strictEqual(context.Pocket.records.length, 1);
          assert.strictEqual(context.Pocket.records[0].balance, 450);
          assert.strictEqual(context.TransField.records.length, 3);
          assert.strictEqual(context.TransValidation.records.length, 2);
          assert.strictEqual(context.TransDefinition.records.length, 1);
          assert.strictEqual(
            context.TransDefinition.records[0].glSteps[1].credit.target,
            context.Pocket.records[0].id,
          );
        });
    },
  },
  {
    name: "seed all executes the manifest once in dependency-safe order",
    run: function () {
      var context = serviceContext(false);
      context.Officer = memoryModel();

      return seedRunner
        .run({
          context: context,
          env: {
            OFFICER_PHONE: "0911111111",
            OFFICER_PASSWORD: "private-password",
          },
        })
        .then(function (results) {
          assert.deepStrictEqual(
            results.map(function (entry) {
              return entry.id;
            }),
            ["currencies", "officer", "p2p", "cash-in"],
          );
          assert.strictEqual(context.Currency.records.length, 9);
          assert.strictEqual(context.Officer.records.length, 1);
          assert.strictEqual(context.Service.records.length, 2);
          assert.strictEqual(context.Pocket.records.length, 2);
          assert.strictEqual(context.TransField.records.length, 6);
          assert.strictEqual(context.TransValidation.records.length, 4);
          assert.strictEqual(context.TransDefinition.records.length, 2);
        });
    },
  },
];

function serviceContext(includeCurrency) {
  var currency = memoryModel(
    includeCurrency === false
      ? []
      : [{ id: "currency-1", code: "VND", status: "active" }],
  );
  return {
    Currency: currency,
    Pocket: memoryModel(),
    Service: memoryModel(),
    TransField: memoryModel(),
    TransValidation: memoryModel(),
    TransDefinition: memoryModel(),
    CryptoService: {
      hashSecret: function (secret) {
        return "hash:" + secret;
      },
      checksumPocket: function (pocket) {
        return [
          pocket.ownerType,
          pocket.ownerId,
          pocket.currency,
          pocket.balance,
        ].join("|");
      },
    },
  };
}

function memoryModel(initialRecords) {
  var model = {
    records: (initialRecords || []).map(copy),
    findOne: function (criteria) {
      return Promise.resolve(
        model.records.filter(function (record) {
          return matches(record, criteria);
        })[0],
      );
    },
    create: function (values) {
      var record = copy(values);
      record.id = record.id || "id-" + (model.records.length + 1);
      model.records.push(record);
      return Promise.resolve(record);
    },
    update: function (criteria, values) {
      var updated = [];
      model.records.forEach(function (record) {
        if (matches(record, criteria)) {
          Object.keys(values).forEach(function (key) {
            record[key] = copy(values[key]);
          });
          updated.push(record);
        }
      });
      return Promise.resolve(updated);
    },
  };

  return model;
}

function matches(record, criteria) {
  return Object.keys(criteria).every(function (key) {
    return String(record[key]) === String(criteria[key]);
  });
}

function copy(value) {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}
