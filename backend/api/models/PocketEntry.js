module.exports = {
  attributes: {
    transRefId: {
      model: "transactiontrail",
      required: true,
    },
    stepOrder: {
      type: "integer",
      required: true,
    },
    debitPocketId: {
      model: "pocket",
      required: true,
    },
    creditPocketId: {
      model: "pocket",
      required: true,
    },
    amount: {
      type: "integer",
      required: true,
    },
    currency: {
      model: "currency",
      required: true,
    },
    status: {
      type: "string",
      enum: ["settled", "failed"],
      defaultsTo: "settled",
      required: true,
    },
    createdBy: {
      type: "string",
    },
    updatedBy: {
      type: "string",
    },
  },
};
