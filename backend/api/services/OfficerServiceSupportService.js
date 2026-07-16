var DOMAIN = require("../../config/domain").domain;

module.exports = {
  asObject: asObject,
  loadService: loadService,
  assertConfigEditable: assertConfigEditable,
  normalizeChildStatusFilter: normalizeChildStatusFilter,
  normalizeChildStatus: normalizeChildStatus,
  normalizeBoolean: normalizeBoolean,
  normalizePositiveInteger: normalizePositiveInteger,
  normalizeNonNegativeInteger: normalizeNonNegativeInteger,
  serializeService: serializeService,
  serviceSummary: serviceSummary,
  serializeTransField: serializeTransField,
  serializeTransValidation: serializeTransValidation,
  serializeTransDefinition: serializeTransDefinition,
  paginationResult: paginationResult,
  requireUpdated: requireUpdated,
  hasChanged: hasChanged,
  cloneJson: cloneJson,
  isDuplicateKeyError: isDuplicateKeyError,
};

function asObject(value) {
  return CommonService.isPlainObject(value) ? value : {};
}

async function loadService(body) {
  body = asObject(body);
  const serviceId = CommonService.cleanString(body.serviceId);
  const serviceCode = CommonService.cleanUpperString(
    body.serviceCode || body.code,
  );
  if (!serviceId && !serviceCode) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_IDENTIFIER_REQUIRED",
    );
  }
  const service = serviceId
    ? await Service.findOne({ id: serviceId })
    : await Service.findOne({ code: serviceCode });
  if (!service) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "SERVICE_NOT_FOUND",
    );
  }
  return service;
}

function assertConfigEditable(service) {
  if (service.status === DOMAIN.status.ACTIVE) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "SERVICE_CONFIG_ACTIVE",
    );
  }
}

function normalizeChildStatusFilter(value) {
  const status = CommonService.cleanString(value).toLowerCase();
  if (
    status &&
    [DOMAIN.status.ACTIVE, DOMAIN.status.INACTIVE].indexOf(status) === -1
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "CONFIG_STATUS_INVALID",
    );
  }
  return status;
}

function normalizeChildStatus(value, defaultValue) {
  const status = CommonService.cleanString(
    value === undefined || value === null ? defaultValue : value,
  ).toLowerCase();
  if (
    [DOMAIN.status.ACTIVE, DOMAIN.status.INACTIVE].indexOf(status) === -1
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "CONFIG_STATUS_INVALID",
    );
  }
  return status;
}

function normalizeBoolean(value, defaultValue, errorCode) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== "boolean") {
    throw AppErrorService.create(EnvelopeService.CODE.BAD_REQUEST, errorCode);
  }
  return value;
}

function normalizePositiveInteger(value, errorCode) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1) {
    throw AppErrorService.create(EnvelopeService.CODE.BAD_REQUEST, errorCode);
  }
  return result;
}

function normalizeNonNegativeInteger(value, errorCode) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) {
    throw AppErrorService.create(EnvelopeService.CODE.BAD_REQUEST, errorCode);
  }
  return result;
}

function serializeService(service) {
  return {
    id: String(service.id),
    code: service.code,
    name: service.name,
    description: service.description || "",
    fieldBuilder: cloneJson(service.fieldBuilder || []),
    actions: cloneJson(service.actions || {}),
    fee: cloneJson(service.fee || {}),
    auth: cloneJson(service.auth || {}),
    status: service.status,
    createdBy: service.createdBy,
    updatedBy: service.updatedBy,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

function serviceSummary(service) {
  return {
    id: String(service.id),
    code: service.code,
    name: service.name,
    status: service.status,
  };
}

function serializeTransField(field) {
  return {
    id: String(field.id),
    serviceId: String(field.service),
    fieldName: field.fieldName,
    fieldFormat: field.fieldFormat,
    minLength: field.minLength,
    maxLength: field.maxLength,
    regex: field.regex,
    isRequired: field.isRequired,
    needSecured: field.needSecured,
    order: field.order,
    errorCode: field.errorCode,
    status: field.status,
    createdBy: field.createdBy,
    updatedBy: field.updatedBy,
    createdAt: field.createdAt,
    updatedAt: field.updatedAt,
  };
}

function serializeTransValidation(validation) {
  return {
    id: String(validation.id),
    serviceId: String(validation.service),
    validateFunc: validation.validateFunc,
    validateFields: validation.validateFields,
    order: validation.order,
    errorCode: validation.errorCode,
    status: validation.status,
    createdBy: validation.createdBy,
    updatedBy: validation.updatedBy,
    createdAt: validation.createdAt,
    updatedAt: validation.updatedAt,
  };
}

function serializeTransDefinition(definition) {
  return {
    id: String(definition.id),
    code: definition.code,
    serviceId: String(definition.service),
    glSteps: cloneJson(definition.glSteps || []),
    status: definition.status,
    createdBy: definition.createdBy,
    updatedBy: definition.updatedBy,
    createdAt: definition.createdAt,
    updatedAt: definition.updatedAt,
  };
}

function paginationResult(paging, total) {
  return {
    page: paging.page,
    pageSize: paging.pageSize,
    total: total,
    totalPages: Math.ceil(total / paging.pageSize),
  };
}

function requireUpdated(rows, message) {
  if (!rows || !rows[0]) {
    throw AppErrorService.create(EnvelopeService.CODE.INVALID_STATE, message);
  }
  return rows[0];
}

function hasChanged(source, updates, ignored) {
  const ignoredKeys = ignored || [];
  const keys = Object.keys(updates);
  for (let i = 0; i < keys.length; i += 1) {
    if (ignoredKeys.indexOf(keys[i]) !== -1) continue;
    if (JSON.stringify(source[keys[i]]) !== JSON.stringify(updates[keys[i]])) {
      return true;
    }
  }
  return false;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function isDuplicateKeyError(err) {
  return !!(
    err &&
    (err.code === 11000 ||
      err.code === 11001 ||
      (err.originalError &&
        [11000, 11001].indexOf(err.originalError.code) !== -1))
  );
}
