module.exports = {
  attributes: {
    type: {
      type: "string",
      required: true,
      index: true,
    },
    code: {
      type: "string",
      required: true,
      index: true,
    },
    serviceCode: {
      type: "string",
      required: true,
      index: true,
    },
    name: {
      type: "string",
      required: true,
      index: true,
    },
    category: {
      type: "string",
      index: true,
    },
    requestUrl: {
      type: "string",
    },
    confirmUrl: {
      type: "string",
    },
    verifyUrl: {
      type: "string",
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
    pocketId: {
      model: "pocket",
    },
    identityKey: {
      type: "string",
      unique: true,
      index: true,
    },
  },
};
