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
    displayName: {
      type: "string",
      index: true,
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
};
