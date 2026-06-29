module.exports = {
  attributes: {
    service: {
      type: "string",
      required: true,
      index: true,
    },
    fieldName: {
      type: "string",
      required: true,
    },
    fieldFormat: {
      type: "string",
      required: true,
    },
    minLength: {
      type: "number",
    },
    maxLength: {
      type: "number",
    },
    regex: {
      type: "string",
    },
    isRequired: {
      type: "boolean",
      required: true,
      defaultsTo: false,
    },
    needSecured: {
      type: "boolean",
      required: true,
      defaultsTo: false,
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
