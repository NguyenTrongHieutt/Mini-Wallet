var DOMAIN = require("../../config/domain").domain;

module.exports = {
  attributes: {
    service: {
      type: "string",
      required: true,
      index: true,
    },
    fieldName: {
      type: "string",
      required: true,
    },
    fieldFormat: {
      type: "string",
      required: true,
    },
    minLength: {
      type: "integer",
    },
    maxLength: {
      type: "integer",
    },
    regex: {
      type: "string",
    },
    isRequired: {
      type: "boolean",
      required: true,
      defaultsTo: false,
    },
    needSecured: {
      type: "boolean",
      required: true,
      defaultsTo: false,
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

  validateFields: function (service, transBody) {
    return TransactionFieldValidationService.validateFields(
      service,
      transBody,
    );
  },
};
