module.exports = {
  attributes: {
    service: {
      type: "string",
      required: true,
      index: true,
    },
    validateFunc: {
      type: "string",
      required: true,
    },
    validateFields: {
      type: "string",
      required: true,
    },
    order: {
      type: "number",
      required: true,
    },
    errorCode: {
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
  },
};
