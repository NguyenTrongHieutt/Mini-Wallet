var DOMAIN = require("../../config/domain").domain;

module.exports = {
  attributes: {
    service: {
      type: "string",
      required: true,
      index: true,
    },
    validateFunc: {
      type: "string",
      required: true,
    },
    validateFields: {
      type: "string",
      required: true,
    },
    order: {
      type: "integer",
      required: true,
    },
    errorCode: {
      type: "string",
    },
    status: {
      type: "string",
      enum: [DOMAIN.status.ACTIVE, DOMAIN.status.INACTIVE],
      defaultsTo: DOMAIN.status.ACTIVE,
      required: true,
      index: true,
    },
    createdBy: {
      type: "string",
    },
    updatedBy: {
      type: "string",
    },
  },

  validateTransaction: function (service, transBody) {
    return TransactionValidationService.validateTransaction(
      service,
      transBody,
    );
  },

  validateReceiverIsNotSender: function (validation, transBody) {
    return TransactionValidationService.validateReceiverIsNotSender(
      validation,
      transBody,
    );
  },

  validateSenderAccountSufficiency: function (validation, transBody) {
    return TransactionValidationService.validateSenderAccountSufficiency(
      validation,
      transBody,
    );
  },

  validateRole: function (validation, transBody, service) {
    return TransactionValidationService.validateRole(
      validation,
      transBody,
      service,
    );
  },
};
