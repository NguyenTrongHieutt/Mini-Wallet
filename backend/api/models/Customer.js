var DOMAIN = require("../../config/domain").domain;

module.exports = {
  attributes: {
    phone: {
      type: "string",
      required: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: "string",
      required: true,
    },
    pinHash: {
      type: "string",
      required: true,
    },
    displayName: {
      type: "string",
      index: true,
    },
    status: {
      type: "string",
      enum: [DOMAIN.status.ACTIVE, DOMAIN.status.LOCKED],
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

  getActiveCustomerByPhone: async function (phone) {
    return Customer.findOne({
      phone: phone,
      status: DOMAIN.status.ACTIVE,
    });
  },
};
