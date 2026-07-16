var DOMAIN = require("../../config/domain").domain;

module.exports = {
  attributes: {
    code: {
      type: "string",
      required: true,
      unique: true,
      index: true,
    },
    serviceId: {
      type: "string",
      required: true,
      index: true,
    },
    transRefId: {
      model: "transactiontrail",
      required: true,
      unique: true,
    },
    senderCustomer: {
      model: "customer",
    },
    receiverCustomer: {
      model: "customer",
    },
    receiverProvider: {
      model: "provider",
    },
    amount: {
      type: "integer",
      required: true,
    },
    fee: {
      type: "integer",
      required: true,
      defaultsTo: 0,
    },
    totalAmount: {
      type: "integer",
      required: true,
    },
    currency: {
      model: "currency",
      required: true,
    },
    message: {
      type: "string",
    },
    status: {
      type: "string",
      enum: [DOMAIN.status.DONE, DOMAIN.status.FAILED],
      defaultsTo: DOMAIN.status.DONE,
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
};
