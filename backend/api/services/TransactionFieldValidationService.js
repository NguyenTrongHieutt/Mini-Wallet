var DOMAIN = require("../../config/domain").domain;

module.exports = {
  validateFields: async function (service, transBody) {
    const fields = ServiceRuntimeService.sortByOrder(
      await TransField.find({
        service: String(service.id),
        status: DOMAIN.status.ACTIVE,
      }),
    );

    for (let i = 0; i < fields.length; i += 1) {
      validateOneField(fields[i], transBody);
    }
  },
};

function validateOneField(field, transBody) {
  const value = transBody[field.fieldName];
  const normalizedFormat = normalizeFieldFormat(field.fieldFormat);

  if (field.isRequired && (value === undefined || value === null || value === "")) {
    throw fieldError(field, value);
  }

  if (value === undefined || value === null || value === "") {
    return;
  }

  if (!isValueType(value, normalizedFormat)) {
    throw fieldError(field, value);
  }

  if (field.regex && !(new RegExp(field.regex).test(String(value)))) {
    throw fieldError(field, value);
  }

  validateRange(field, value, normalizedFormat);
}

function fieldError(field, value) {
  return AppErrorService.create(
    EnvelopeService.CODE.BAD_REQUEST,
    field.errorCode || "TRANSACTION_FIELD_INVALID",
    { field: field.fieldName, value: value }
  );
}

function normalizeFieldFormat(fieldFormat) {
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
}

function isValueType(value, fieldFormat) {
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
}

function validateRange(field, value, fieldFormat) {
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
    throw fieldError(field, value);
  }

  if (field.maxLength !== undefined && comparable > field.maxLength) {
    throw fieldError(field, value);
  }
}
