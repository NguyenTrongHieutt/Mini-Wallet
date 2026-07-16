module.exports = {
  attributes: {
    code: {
      type: "string",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: "string",
      required: true,
    },
    minorUnit: {
      type: "integer",
      required: true,
      defaultsTo: 0,
    },
    status: {
      type: "string",
      enum: ["active", "inactive"],
      defaultsTo: "active",
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

  loadActive: async function (currencyCode) {
    const currency = await Currency.findOne({ code: currencyCode || "VND", status: "active" });
    if (!currency) {
      throw AppErrorService.create(EnvelopeService.CODE.NOT_FOUND, "CURRENCY_NOT_FOUND");
    }

    return currency;
  },
};
