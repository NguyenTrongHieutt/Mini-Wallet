module.exports = {
  attributes: {
    transRefId: {
      model: "transactiontrail",
      required: true,
    },
    stepOrder: {
      type: "number",
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
      type: "number",
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
