module.exports = {
  attributes: {
    serviceId: {
      model: "service",
      required: true,
      index: true,
    },
    customerId: {
      model: "customer",
      index: true,
    },
    officerId: {
      model: "officer",
      index: true,
    },
    inputMessage: {
      type: "json",
      required: true,
    },
    outputMessage: {
      type: "json",
      required: true,
    },
    status: {
      type: "string",
      enum: ["init", "pending", "done", "failed", "cancelled"],
      defaultsTo: "init",
      required: true,
      index: true,
    },
    expiredAt: {
      type: "datetime",
      required: true,
      index: true,
    },
    errorCode: {
      type: "string",
    },
    errorMessage: {
      type: "string",
    },
    entries: {
      collection: "pocketentry",
      via: "transRefId",
    },
    transactions: {
      collection: "transaction",
      via: "transRefId",
    },
    createdBy: {
      type: "string",
    },
    updatedBy: {
      type: "string",
    },
  },
};
