"use strict";

var assert = require("assert");
var path = require("path");

var runtimePath = path.resolve(
  __dirname,
  "../../api/services/RuntimeProcessService.js",
);

module.exports = [
  {
    name: "keeps provider verify transactional and releases locks on failure",
    run: async function () {
      var names = [
        "NeonMessageService",
        "ServiceRuntimeService",
        "Pocket",
        "TransactionTrail",
        "TransactionFieldValidationService",
        "TransactionValidationService",
        "TransDefinition",
        "Currency",
        "MiniWalletConfigService",
        "MongoTransactionExecutorService",
        "LedgerRepositoryService",
        "AppErrorService",
        "EnvelopeService",
      ];
      var previous = {};
      names.forEach(function (name) {
        previous[name] = global[name];
      });

      var transactionActive = false;
      var providerCalledInsideTransaction = false;
      var released = 0;
      var failedStatus;
      var providerError = new Error("PROVIDER_VERIFY_FAILED");
      var transBody = {
        SENDERID: "sender-pocket",
        USERID: "customer-1",
        AMOUNT: 10,
        TOTALAMOUNT: 10,
        CURRENCY: "VND",
      };

      global.NeonMessageService = {
        buildMessage: function () {
          return Promise.resolve({
            trail: { id: "trail-1", serviceId: "service-1" },
            transInput: { body: {}, user: { id: "customer-1" } },
            TRANSBODY: transBody,
          });
        },
      };
      global.ServiceRuntimeService = {
        loadActiveById: function () {
          return Promise.resolve({ id: "service-1", code: "TEST" });
        },
        verifyAuth: function () {},
        calculateFee: function () {},
        sortByOrder: function (steps) {
          return steps;
        },
        runVerifyAction: function () {
          providerCalledInsideTransaction = transactionActive;
          return Promise.reject(providerError);
        },
      };
      global.Pocket = {
        validateStateAndLockPocket: function () {
          return Promise.resolve({ id: "sender-pocket" });
        },
        validateChecksum: function () {},
        releaseLockedPocket: function () {
          released += 1;
          return Promise.resolve();
        },
      };
      global.TransactionTrail = {
        checkStatusTrail: function () {
          return Promise.resolve();
        },
        markFailed: function (trail, err, expectedStatus) {
          assert.strictEqual(err, providerError);
          failedStatus = expectedStatus;
          return Promise.resolve();
        },
      };
      global.TransactionFieldValidationService = {
        validateFields: function () {
          return Promise.resolve();
        },
      };
      global.TransactionValidationService = {
        validateTransaction: function () {
          return Promise.resolve();
        },
      };
      global.TransDefinition = {
        loadActiveByService: function () {
          return Promise.resolve({ glSteps: [] });
        },
      };
      global.Currency = {
        loadActive: function () {
          return Promise.resolve({ id: "currency-1", code: "VND" });
        },
      };
      global.MiniWalletConfigService = {
        wallet: function () {
          return { defaultCurrency: "VND" };
        },
      };
      global.MongoTransactionExecutorService = {
        withTransaction: async function (work) {
          transactionActive = true;
          try {
            return await work({});
          } finally {
            transactionActive = false;
          }
        },
        isTransactionUnavailable: function () {
          return false;
        },
      };
      global.LedgerRepositoryService = {
        create: function () {
          return {
            insertTransaction: function (transaction) {
              return Promise.resolve(
                Object.assign({ id: "transaction-1" }, transaction),
              );
            },
          };
        },
      };
      global.AppErrorService = {
        create: function (code, message) {
          var err = new Error(message);
          err.code = code;
          return err;
        },
      };
      global.EnvelopeService = {
        CODE: {
          INVALID_STATE: "INVALID_STATE",
        },
      };

      try {
        delete require.cache[runtimePath];
        var runtime = require(runtimePath);
        var caughtError;
        try {
          await runtime.processVerifyStep({});
        } catch (err) {
          caughtError = err;
        }
        assert.strictEqual(caughtError, providerError);
        assert.strictEqual(providerCalledInsideTransaction, true);
        assert.strictEqual(failedStatus, "pending");
        assert.strictEqual(released, 1);
      } finally {
        names.forEach(function (name) {
          global[name] = previous[name];
        });
      }
    },
  },
];
