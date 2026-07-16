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
};
