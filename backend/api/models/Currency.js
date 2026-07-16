var DOMAIN = require("../../config/domain").domain;

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

  loadActive: async function (currencyCode) {
    const config = MiniWalletConfigService.wallet();
    const currency = await Currency.findOne({
      code: currencyCode || config.defaultCurrency,
      status: DOMAIN.status.ACTIVE,
    });
    if (!currency) {
      throw AppErrorService.create(EnvelopeService.CODE.NOT_FOUND, "CURRENCY_NOT_FOUND");
    }

    return currency;
  },
};
