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
    description: {
      type: "string",
    },
    fieldBuilder: {
      type: "array",
      required: true,
    },
    actions: {
      type: "json",
    },
    fee: {
      type: "json",
      required: true,
    },
    auth: {
      type: "json",
      required: true,
    },
    status: {
      type: "string",
      enum: ["draft", "active", "inactive"],
      defaultsTo: "draft",
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
