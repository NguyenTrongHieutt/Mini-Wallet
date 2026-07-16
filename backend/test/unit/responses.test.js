"use strict";

var assert = require("assert");
var EnvelopeService = require("../../api/services/EnvelopeService");

module.exports = [
  responseTest("ok", "../../api/responses/ok", [], {
    err: 200,
    code: "OK",
    message: "OK",
  }),
  responseTest("created", "../../api/responses/created", [{ id: "created" }], {
    err: 200,
    code: "OK",
    message: "OK",
    data: { id: "created" },
  }),
  responseTest("badRequest", "../../api/responses/badRequest", [], {
    err: 400,
    code: "BAD_REQUEST",
    message: "Bad request",
  }),
  responseTest("forbidden", "../../api/responses/forbidden", [], {
    err: 403,
    code: "FORBIDDEN",
    message: "Forbidden",
  }),
  responseTest("notFound", "../../api/responses/notFound", [], {
    err: 404,
    code: "NOT_FOUND",
    message: "Not found",
  }),
  responseTest("serverError", "../../api/responses/serverError", [], {
    err: 500,
    code: "SERVER_ERROR",
    message: "Server error",
  }),
  responseTest("error", "../../api/responses/error", [409, "CUSTOMER_PHONE_EXISTS"], {
    err: 409,
    code: "CUSTOMER_PHONE_EXISTS",
    message: "Customer phone already exists",
  }),
];

function responseTest(name, modulePath, args, expectedPayload) {
  return {
    name: name + " preserves HTTP 200 and the legacy envelope",
    run: function () {
      var previousEnvelopeService = global.EnvelopeService;
      var statusCode;
      var payload;
      var response = {
        status: function (value) {
          statusCode = value;
          return response;
        },
        jsonx: function (value) {
          payload = value;
          return value;
        },
      };

      global.EnvelopeService = EnvelopeService;
      try {
        var responder = require(modulePath);
        var returned = responder.apply({ res: response }, args);

        assert.strictEqual(statusCode, 200);
        assert.deepStrictEqual(payload, expectedPayload);
        assert.deepStrictEqual(returned, expectedPayload);
      } finally {
        if (previousEnvelopeService === undefined) {
          delete global.EnvelopeService;
        } else {
          global.EnvelopeService = previousEnvelopeService;
        }
      }
    },
  };
}
