"use strict";

var assert = require("assert");
var path = require("path");

var pocketPath = path.resolve(__dirname, "../../api/models/Pocket.js");

module.exports = [
  {
    name: "rejects concurrent verify using the same transaction lock",
    run: async function () {
      var previousPocket = global.Pocket;
      var previousAppErrorService = global.AppErrorService;
      var previousEnvelopeService = global.EnvelopeService;
      var updateCalls = 0;

      global.AppErrorService = {
        create: function (code, messageKey, data) {
          var err = new Error(messageKey);
          err.code = code;
          err.messageKey = messageKey;
          err.data = data;
          return err;
        },
      };
      global.EnvelopeService = {
        CODE: {
          INVALID_STATE: 4,
          NOT_FOUND: 3,
        },
      };

      try {
        delete require.cache[pocketPath];
        var pocketModel = require(pocketPath);
        global.Pocket = pocketModel;
        pocketModel.findOne = function () {
          return Promise.resolve({
            id: "pocket-1",
            status: "locked",
            lockedBy: "trail-1",
            lockExpiredAt: new Date(Date.now() + 60000),
          });
        };
        pocketModel.update = function () {
          updateCalls += 1;
          return Promise.resolve([]);
        };

        var caughtError;
        try {
          await pocketModel.validateStateAndLockPocket(
            "pocket-1",
            "trail-1",
          );
        } catch (err) {
          caughtError = err;
        }

        assert.ok(caughtError, "concurrent verify must be rejected");
        assert.strictEqual(caughtError.code, 4);
        assert.strictEqual(
          caughtError.messageKey,
          "TRANSACTION_ALREADY_PROCESSING",
        );
        assert.deepStrictEqual(caughtError.data, {
          pocketId: "pocket-1",
          transRefId: "trail-1",
        });
        assert.strictEqual(
          updateCalls,
          0,
          "same transaction must not refresh or re-enter the lock",
        );
      } finally {
        global.Pocket = previousPocket;
        global.AppErrorService = previousAppErrorService;
        global.EnvelopeService = previousEnvelopeService;
      }
    },
  },
];
