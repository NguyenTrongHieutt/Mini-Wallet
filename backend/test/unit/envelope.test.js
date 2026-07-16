"use strict";

var assert = require("assert");
var EnvelopeService = require("../../api/services/EnvelopeService");

module.exports = [
  {
    name: "resolves known, default and literal messages",
    run: function () {
      assert.strictEqual(EnvelopeService.message("NOT_FOUND"), "Not found");
      assert.strictEqual(EnvelopeService.message(), "OK");
      assert.strictEqual(
        EnvelopeService.message("A literal legacy message"),
        "A literal legacy message",
      );
    },
  },
  {
    name: "formats the legacy err/message/data envelope",
    run: function () {
      var data = { id: "wallet-1", balance: 0 };
      var result = EnvelopeService.format(
        EnvelopeService.CODE.OK,
        "CUSTOMER_WALLET_BALANCE",
        data,
      );

      assert.deepStrictEqual(result, {
        err: 200,
        code: "CUSTOMER_WALLET_BALANCE",
        message: "Customer wallet balance",
        data: data,
      });
      assert.notStrictEqual(result.data, data);
      assert.deepStrictEqual(EnvelopeService.format(200, "OK"), {
        err: 200,
        code: "OK",
        message: "OK",
      });
    },
  },
  {
    name: "normalizes legacy and internal envelope objects",
    run: function () {
      assert.deepStrictEqual(
        EnvelopeService.normalize(
          [{ err: 409, message: "Already exists", data: { id: "1" } }],
          500,
          "ERROR",
        ),
        { code: 409, message: "Already exists", data: { id: "1" } },
      );

      assert.deepStrictEqual(
        EnvelopeService.normalize(
          [{ code: 422, message: "Invalid state", data: { state: "done" } }],
          500,
          "ERROR",
        ),
        { code: 422, message: "Invalid state", data: { state: "done" } },
      );
    },
  },
  {
    name: "normalizes positional response arguments",
    run: function () {
      assert.deepStrictEqual(
        EnvelopeService.normalize([404, "NOT_FOUND", { id: "missing" }], 500, "ERROR"),
        { code: 404, message: "NOT_FOUND", data: { id: "missing" } },
      );
      assert.deepStrictEqual(
        EnvelopeService.normalize(["LOGIN_SUCCESS", { token: "token" }], 200, "OK"),
        { code: 200, message: "LOGIN_SUCCESS", data: { token: "token" } },
      );
      assert.deepStrictEqual(
        EnvelopeService.normalize([{ id: "data-only" }], 200, "OK"),
        { code: 200, message: "OK", data: { id: "data-only" } },
      );
    },
  },
];
