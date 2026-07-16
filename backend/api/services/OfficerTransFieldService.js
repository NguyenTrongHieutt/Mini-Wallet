var DOMAIN = require("../../config/domain").domain;
var support = require("./OfficerServiceSupportService");

module.exports = {
  list: list,
  insert: insert,
  update: update,
  validate: validateTransField,
};

async function list(body) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  const status = support.normalizeChildStatusFilter(body.status);
  const criteria = { service: String(service.id) };
  if (status) criteria.status = status;
  const items = await TransField.find(criteria).sort({
    order: 1,
    createdAt: 1,
  });

  return {
    service: support.serviceSummary(service),
    items: items.map(support.serializeTransField),
    total: items.length,
  };
}

async function insert(body, officer) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  support.assertConfigEditable(service);
  const values = normalizeTransField(body);
  const duplicate = await TransField.findOne({
    service: String(service.id),
    fieldName: values.fieldName,
  });
  if (duplicate) {
    throw AppErrorService.create(
      EnvelopeService.CODE.CONFLICT,
      "TRANS_FIELD_ALREADY_EXISTS",
      { transFieldId: String(duplicate.id) },
    );
  }

  values.service = String(service.id);
  values.createdBy = String(officer.id);
  values.updatedBy = String(officer.id);
  let field;
  try {
    field = await TransField.create(values);
  } catch (err) {
    if (support.isDuplicateKeyError(err)) {
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "TRANS_FIELD_ALREADY_EXISTS",
      );
    }
    throw err;
  }

  return {
    service: support.serviceSummary(service),
    transField: support.serializeTransField(field),
  };
}

async function update(body, officer) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  support.assertConfigEditable(service);
  const field = await loadTransField(body, service);
  const updates = normalizeTransFieldUpdate(body, field);

  if (updates.fieldName && updates.fieldName !== field.fieldName) {
    const duplicate = await TransField.findOne({
      service: String(service.id),
      fieldName: updates.fieldName,
    });
    if (duplicate && String(duplicate.id) !== String(field.id)) {
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "TRANS_FIELD_ALREADY_EXISTS",
        { transFieldId: String(duplicate.id) },
      );
    }
  }

  updates.updatedBy = String(officer.id);
  if (!support.hasChanged(field, updates, ["updatedBy"])) {
    return { transField: support.serializeTransField(field), changed: false };
  }

  let rows;
  try {
    rows = await TransField.update({ id: field.id }, updates);
  } catch (err) {
    if (support.isDuplicateKeyError(err)) {
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "TRANS_FIELD_ALREADY_EXISTS",
      );
    }
    throw err;
  }
  return {
    transField: support.serializeTransField(
      support.requireUpdated(rows, "TRANS_FIELD_UPDATE_FAILED"),
    ),
    changed: true,
  };
}

function normalizeTransField(body) {
  const field = {
    fieldName: CommonService.cleanUpperString(body.fieldName),
    fieldFormat: CommonService.cleanString(body.fieldFormat).toLowerCase(),
    isRequired: support.normalizeBoolean(
      body.isRequired,
      false,
      "TRANS_FIELD_INVALID",
    ),
    needSecured: support.normalizeBoolean(
      body.needSecured,
      false,
      "TRANS_FIELD_INVALID",
    ),
    order: support.normalizePositiveInteger(body.order, "TRANS_FIELD_INVALID"),
    status: support.normalizeChildStatus(body.status, DOMAIN.status.ACTIVE),
  };
  if (body.minLength !== undefined && body.minLength !== null) {
    field.minLength = support.normalizeNonNegativeInteger(
      body.minLength,
      "TRANS_FIELD_INVALID",
    );
  }
  if (body.maxLength !== undefined && body.maxLength !== null) {
    field.maxLength = support.normalizeNonNegativeInteger(
      body.maxLength,
      "TRANS_FIELD_INVALID",
    );
  }
  field.regex = CommonService.cleanString(body.regex) || undefined;
  field.errorCode = CommonService.cleanUpperString(body.errorCode) || undefined;
  validateTransField(field);
  return field;
}

function normalizeTransFieldUpdate(body, existing) {
  const editable = [
    "fieldName",
    "fieldFormat",
    "minLength",
    "maxLength",
    "regex",
    "isRequired",
    "needSecured",
    "order",
    "errorCode",
    "status",
  ];
  const merged = {};
  let supplied = false;
  for (let i = 0; i < editable.length; i += 1) {
    const key = editable[i];
    merged[key] = Object.prototype.hasOwnProperty.call(body, key)
      ? body[key]
      : existing[key];
    if (Object.prototype.hasOwnProperty.call(body, key)) supplied = true;
  }
  if (!supplied) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "TRANS_FIELD_UPDATE_REQUIRED",
    );
  }
  const normalized = normalizeTransField(merged);
  const updates = {};
  for (let j = 0; j < editable.length; j += 1) {
    if (Object.prototype.hasOwnProperty.call(body, editable[j])) {
      updates[editable[j]] = normalized[editable[j]];
      if (
        ["minLength", "maxLength", "regex", "errorCode"].indexOf(
          editable[j],
        ) !== -1 &&
        normalized[editable[j]] === undefined
      ) {
        updates[editable[j]] = null;
      }
    }
  }
  return updates;
}

function validateTransField(field) {
  const formats = [
    "string",
    "number",
    "boolean",
    "object",
    "phone",
    "text",
    "integer",
    "int",
    "float",
    "decimal",
    "bool",
    "array",
    "json",
  ];
  if (
    !/^[A-Z][A-Z0-9_]{0,99}$/.test(field.fieldName) ||
    formats.indexOf(field.fieldFormat) === -1
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "TRANS_FIELD_INVALID",
    );
  }
  if (
    field.minLength !== undefined &&
    field.maxLength !== undefined &&
    field.minLength > field.maxLength
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "TRANS_FIELD_INVALID",
    );
  }
  if (field.regex) {
    try {
      new RegExp(field.regex);
    } catch (err) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "TRANS_FIELD_REGEX_INVALID",
      );
    }
  }
}

async function loadTransField(body, service) {
  const id = CommonService.cleanString(body.transFieldId || body.fieldId);
  if (!id) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "TRANS_FIELD_IDENTIFIER_REQUIRED",
    );
  }
  const field = await TransField.findOne({
    id: id,
    service: String(service.id),
  });
  if (!field) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "TRANS_FIELD_NOT_FOUND",
    );
  }
  return field;
}
