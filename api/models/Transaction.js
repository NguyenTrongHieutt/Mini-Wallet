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
      index: true,
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
      enum: ["done", "failed"],
      defaultsTo: "done",
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
