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
      type: "number",
      required: true,
    },
    fee: {
      type: "number",
      required: true,
      defaultsTo: 0,
    },
    totalAmount: {
      type: "number",
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
