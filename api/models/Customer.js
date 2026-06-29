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
