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
      type: "integer",
    },
    maxLength: {
      type: "integer",
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
      type: "integer",
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

  validateFields: async function (service, transBody) {
    const fields = Service.sortByOrder(
      await TransField.find({ service: String(service.id), status: "active" })
    );

    for (let i = 0; i < fields.length; i += 1) {
      this.validateOneField(fields[i], transBody);
    }
  },

  validateOneField: function (field, transBody) {
    const value = transBody[field.fieldName];
    const normalizedFormat = this.normalizeFieldFormat(field.fieldFormat);

    if (field.isRequired && (value === undefined || value === null || value === "")) {
      throw this.fieldError(field, value);
    }

    if (value === undefined || value === null || value === "") {
      return;
    }

    if (!this.isValueType(value, normalizedFormat)) {
      throw this.fieldError(field, value);
    }

    if (field.regex && !(new RegExp(field.regex).test(String(value)))) {
      throw this.fieldError(field, value);
    }

    this.validateRange(field, value, normalizedFormat);
  },

  fieldError: function (field, value) {
    return AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      field.errorCode || "TRANSACTION_FIELD_INVALID",
      { field: field.fieldName, value: value }
    );
  },

  normalizeFieldFormat: function (fieldFormat) {
    const format = String(fieldFormat || "").toLowerCase();
    const aliases = {
      phone: "string",
      text: "string",
      integer: "number",
      int: "number",
      float: "number",
      decimal: "number",
      bool: "boolean",
      array: "object",
      json: "object",
    };

    return aliases[format] || format;
  },

  isValueType: function (value, fieldFormat) {
    if (fieldFormat === "string") {
      return typeof value === "string";
    }

    if (fieldFormat === "number") {
      const numberValue = Number(value);
      return Number.isFinite(numberValue);
    }

    if (fieldFormat === "boolean") {
      return typeof value === "boolean";
    }

    if (fieldFormat === "object") {
      return typeof value === "object";
    }

    return false;
  },

  validateRange: function (field, value, fieldFormat) {
    if (field.minLength === undefined && field.maxLength === undefined) {
      return;
    }

    let comparable;
    if (fieldFormat === "number") {
      comparable = Number(value);
    } else if (fieldFormat === "string") {
      comparable = String(value).length;
    } else if (fieldFormat === "object" && Array.isArray(value)) {
      comparable = value.length;
    } else {
      return;
    }

    if (field.minLength !== undefined && comparable < field.minLength) {
      throw this.fieldError(field, value);
    }

    if (field.maxLength !== undefined && comparable > field.maxLength) {
      throw this.fieldError(field, value);
    }
  },
};
