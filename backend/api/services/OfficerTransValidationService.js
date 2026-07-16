var DOMAIN = require("../../config/domain").domain;
var support = require("./OfficerServiceSupportService");

module.exports = {
  list: list,
  insert: insert,
  update: update,
  validate: validateTransValidation,
};

async function list(body) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  const status = support.normalizeChildStatusFilter(body.status);
  const criteria = { service: String(service.id) };
  if (status) criteria.status = status;
  const items = await TransValidation.find(criteria).sort({
    order: 1,
    createdAt: 1,
  });

  return {
    service: support.serviceSummary(service),
    items: items.map(support.serializeTransValidation),
    total: items.length,
  };
}

async function insert(body, officer) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  support.assertConfigEditable(service);
  const values = normalizeTransValidation(body);
  const duplicate = await findDuplicateValidation(service.id, values, null);
  if (duplicate) {
    throw AppErrorService.create(
      EnvelopeService.CODE.CONFLICT,
      "TRANS_VALIDATION_ALREADY_EXISTS",
      { transValidationId: String(duplicate.id) },
    );
  }

  values.service = String(service.id);
  values.createdBy = String(officer.id);
  values.updatedBy = String(officer.id);
  const validation = await TransValidation.create(values);
  return {
    service: support.serviceSummary(service),
    transValidation: support.serializeTransValidation(validation),
  };
}

async function update(body, officer) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  support.assertConfigEditable(service);
  const validation = await loadTransValidation(body, service);
  const updates = normalizeTransValidationUpdate(body, validation);
  const merged = Object.assign({}, validation, updates);
  const duplicate = await findDuplicateValidation(
    service.id,
    merged,
    validation.id,
  );
  if (duplicate) {
    throw AppErrorService.create(
      EnvelopeService.CODE.CONFLICT,
      "TRANS_VALIDATION_ALREADY_EXISTS",
      { transValidationId: String(duplicate.id) },
    );
  }

  updates.updatedBy = String(officer.id);
  if (!support.hasChanged(validation, updates, ["updatedBy"])) {
    return {
      transValidation: support.serializeTransValidation(validation),
      changed: false,
    };
  }

  const rows = await TransValidation.update({ id: validation.id }, updates);
  return {
    transValidation: support.serializeTransValidation(
      support.requireUpdated(rows, "TRANS_VALIDATION_UPDATE_FAILED"),
    ),
    changed: true,
  };
}

function normalizeTransValidation(body) {
  const validation = {
    validateFunc: CommonService.cleanString(body.validateFunc),
    validateFields: CommonService.cleanString(body.validateFields),
    order: support.normalizePositiveInteger(
      body.order,
      "TRANS_VALIDATION_INVALID",
    ),
    errorCode: CommonService.cleanUpperString(body.errorCode) || undefined,
    status: support.normalizeChildStatus(body.status, DOMAIN.status.ACTIVE),
  };
  validateTransValidation(validation);
  return validation;
}

function normalizeTransValidationUpdate(body, existing) {
  const editable = [
    "validateFunc",
    "validateFields",
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
      "TRANS_VALIDATION_UPDATE_REQUIRED",
    );
  }
  const normalized = normalizeTransValidation(merged);
  const updates = {};
  for (let j = 0; j < editable.length; j += 1) {
    if (Object.prototype.hasOwnProperty.call(body, editable[j])) {
      updates[editable[j]] = normalized[editable[j]];
      if (editable[j] === "errorCode" && normalized.errorCode === undefined) {
        updates.errorCode = null;
      }
    }
  }
  return updates;
}

function validateTransValidation(validation) {
  if (
    !ValidationRegistryService.supports(validation.validateFunc) ||
    !validation.validateFields
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "TRANS_VALIDATION_INVALID",
    );
  }
  if (validation.validateFields.charAt(0) === "{") {
    try {
      const config = JSON.parse(validation.validateFields);
      if (!CommonService.isPlainObject(config)) {
        throw new Error("object required");
      }
    } catch (err) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "VALIDATION_CONFIG_INVALID",
      );
    }
  }
}

async function loadTransValidation(body, service) {
  const id = CommonService.cleanString(
    body.transValidationId || body.validationId,
  );
  if (!id) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "TRANS_VALIDATION_IDENTIFIER_REQUIRED",
    );
  }
  const validation = await TransValidation.findOne({
    id: id,
    service: String(service.id),
  });
  if (!validation) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "TRANS_VALIDATION_NOT_FOUND",
    );
  }
  return validation;
}

async function findDuplicateValidation(serviceId, values, excludedId) {
  const duplicate = await TransValidation.findOne({
    service: String(serviceId),
    validateFunc: values.validateFunc,
    validateFields: values.validateFields,
  });
  if (duplicate && String(duplicate.id) !== String(excludedId || "")) {
    return duplicate;
  }
  return null;
}
