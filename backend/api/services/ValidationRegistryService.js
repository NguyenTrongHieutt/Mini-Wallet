"use strict";

var HANDLER_ALIASES = {
  validateReceiverIsNotSender: "validateReceiverIsNotSender",
  validateSenderAccountSufficiency: "validateSenderAccountSufficiency",
  validateRole: "validateRole",
  validateUserRole: "validateRole",
  validateFieldRole: "validateRole",
  checkRole: "validateRole",
  checkUserRole: "validateRole",
};

module.exports = {
  names: function () {
    return Object.keys(HANDLER_ALIASES);
  },

  supports: function (handlerName) {
    return !!HANDLER_ALIASES[String(handlerName || "")];
  },

  canonicalName: function (handlerName) {
    return HANDLER_ALIASES[String(handlerName || "")] || null;
  },

  execute: function (validation, transBody, service) {
    var handlerName = validation && validation.validateFunc;
    var canonicalName = this.canonicalName(handlerName);
    var handler =
      canonicalName && TransactionValidationService[canonicalName];

    if (typeof handler !== "function") {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "UNSUPPORTED_VALIDATION_RULE",
        { validateFunc: handlerName },
      );
    }

    return handler.call(
      TransactionValidationService,
      validation,
      transBody,
      service,
    );
  },
};
