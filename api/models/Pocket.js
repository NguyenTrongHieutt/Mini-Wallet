module.exports = {
  attributes: {
    ownerId: {
      type: "string",
      required: true,
      index: true,
    },

    ownerType: {
      type: "string",
      enum: ["customer", "provider", "system", "bank"],
      required: true,
      index: true,
    },
    currency: {
      model: "currency",
      required: true,
    },
    balance: {
      type: "integer",
      required: true,
      defaultsTo: 0,
    },
    checksum: {
      type: "string",
      required: true,
    },
    name: {
      type: "string",
      required: true,
    },
    status: {
      type: "string",
      enum: ["active", "locked"],
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
};
