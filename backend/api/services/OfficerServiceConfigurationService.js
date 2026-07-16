var DOMAIN = require("../../config/domain").domain;
var support = require("./OfficerServiceSupportService");

module.exports = {
  updateFieldBuilder: updateFieldBuilder,
  updateActions: updateActions,
  detailTransDefinition: detailTransDefinition,
  updateTransDefinition: updateTransDefinition,
  normalizeServiceCreate: normalizeServiceCreate,
  normalizeServiceUpdate: normalizeServiceUpdate,
  normalizeServiceName: normalizeServiceName,
  normalizeFee: normalizeFee,
  normalizeAuth: normalizeAuth,
  normalizeFieldBuilder: normalizeFieldBuilder,
  normalizeGlSteps: normalizeGlSteps,
  buildAvailableFieldMap: buildAvailableFieldMap,
  validateDefinitionTargetField: validateDefinitionTargetField,
};

async function updateFieldBuilder(body, officer) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  support.assertConfigEditable(service);
  if (!Object.prototype.hasOwnProperty.call(body, "fieldBuilder")) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "FIELD_BUILDER_REQUIRED",
    );
  }
  const fieldBuilder = normalizeFieldBuilder(body.fieldBuilder, false);
  const updates = {
    fieldBuilder: fieldBuilder,
    updatedBy: String(officer.id),
  };

  if (!support.hasChanged(service, updates, ["updatedBy"])) {
    return { service: support.serializeService(service), changed: false };
  }

  const rows = await Service.update({ id: service.id }, updates);
  return {
    service: support.serializeService(
      support.requireUpdated(rows, "FIELD_BUILDER_UPDATE_FAILED"),
    ),
    changed: true,
  };
}

async function updateActions(body, officer) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  support.assertConfigEditable(service);
  const actions = buildActionsUpdate(body, service.actions || {});
  const updates = {
    actions: actions,
    updatedBy: String(officer.id),
  };

  if (!support.hasChanged(service, updates, ["updatedBy"])) {
    return { service: support.serializeService(service), changed: false };
  }

  const rows = await Service.update({ id: service.id }, updates);
  return {
    service: support.serializeService(
      support.requireUpdated(rows, "SERVICE_ACTIONS_UPDATE_FAILED"),
    ),
    changed: true,
  };
}

async function detailTransDefinition(body) {
  const service = await support.loadService(body);
  const definition = await TransDefinition.findOne({
    service: String(service.id),
  });
  if (!definition) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "TRANS_DEFINITION_NOT_FOUND",
    );
  }

  return {
    service: support.serviceSummary(service),
    transDefinition: support.serializeTransDefinition(definition),
  };
}

async function updateTransDefinition(body, officer) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  support.assertConfigEditable(service);
  const glSteps = normalizeGlSteps(body.glSteps, false);
  const status = support.normalizeChildStatus(
    body.status,
    DOMAIN.status.ACTIVE,
  );
  const existing = await TransDefinition.findOne({
    service: String(service.id),
  });
  const values = {
    code: String(service.id),
    service: String(service.id),
    glSteps: glSteps,
    status: status,
    updatedBy: String(officer.id),
  };

  let definition;
  let created = false;
  let changed = true;
  if (existing) {
    changed = support.hasChanged(existing, values, ["updatedBy"]);
    if (!changed) {
      definition = existing;
    } else {
      definition = support.requireUpdated(
        await TransDefinition.update({ id: existing.id }, values),
        "TRANS_DEFINITION_UPDATE_FAILED",
      );
    }
  } else {
    values.createdBy = String(officer.id);
    definition = await TransDefinition.create(values);
    created = true;
  }

  return {
    service: support.serviceSummary(service),
    transDefinition: support.serializeTransDefinition(definition),
    created: created,
    changed: changed,
  };
}

function normalizeServiceCreate(body) {
  return {
    code: normalizeServiceCode(body.serviceCode || body.code),
    name: normalizeServiceName(body.name),
    description: normalizeDescription(body.description),
    fieldBuilder: normalizeFieldBuilder(body.fieldBuilder || [], false),
    actions: normalizeActions(body.actions),
    fee: normalizeFee(body.fee),
    auth: normalizeAuth(body.auth),
    status: DOMAIN.status.DRAFT,
  };
}

function normalizeServiceUpdate(body, service) {
  const updates = {};
  let supplied = false;
  const allowed = ["name", "description", "actions", "fee", "auth"];
  for (let i = 0; i < allowed.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(body, allowed[i])) {
      supplied = true;
      if (allowed[i] === "name") updates.name = normalizeServiceName(body.name);
      if (allowed[i] === "description") {
        updates.description = normalizeDescription(body.description);
      }
      if (allowed[i] === "actions") {
        updates.actions = normalizeActions(body.actions);
      }
      if (allowed[i] === "fee") updates.fee = normalizeFee(body.fee);
      if (allowed[i] === "auth") updates.auth = normalizeAuth(body.auth);
    }
  }
  if (!supplied) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_UPDATE_REQUIRED",
    );
  }

  normalizeServiceName(
    updates.name === undefined ? service.name : updates.name,
  );
  return updates;
}

function normalizeServiceCode(value) {
  const code = CommonService.cleanUpperString(value);
  if (!code) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_CODE_REQUIRED",
    );
  }
  if (!/^[A-Z0-9][A-Z0-9_-]{1,99}$/.test(code)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_CODE_INVALID",
    );
  }
  return code;
}

function normalizeServiceName(value) {
  const name = CommonService.cleanString(value);
  if (!name) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_NAME_REQUIRED",
    );
  }
  if (name.length < 2 || name.length > 100) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_NAME_LENGTH_INVALID",
    );
  }
  return name;
}

function normalizeDescription(value) {
  const description = CommonService.cleanString(value);
  if (description.length > 1000) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_DESCRIPTION_LENGTH_INVALID",
    );
  }
  return description;
}

function normalizeActions(value) {
  if (value === undefined || value === null) return {};
  if (!CommonService.isPlainObject(value)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_ACTIONS_INVALID",
    );
  }
  return support.cloneJson(value);
}

function buildActionsUpdate(body, currentActions) {
  if (Object.prototype.hasOwnProperty.call(body, "actions")) {
    return normalizeActions(body.actions);
  }

  const actionName = CommonService.cleanString(body.actionName).toLowerCase();
  const supportedActions = [
    DOMAIN.action.PROVIDER,
    DOMAIN.action.REQUEST,
    DOMAIN.action.CONFIRM,
    DOMAIN.action.VERIFY,
  ];
  if (!actionName || supportedActions.indexOf(actionName) === -1) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_ACTION_NAME_INVALID",
    );
  }
  if (!CommonService.isPlainObject(body.action)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_ACTION_INVALID",
    );
  }

  const actions = normalizeActions(currentActions);
  actions[actionName] = support.cloneJson(body.action);
  return actions;
}

function normalizeFee(value) {
  if (value === undefined || value === null) {
    return { type: "fixed", value: 0 };
  }
  if (!CommonService.isPlainObject(value)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_FEE_INVALID",
    );
  }
  const fee = support.cloneJson(value);
  fee.type = CommonService.cleanString(fee.type || "fixed").toLowerCase();
  if (["fixed", "percent"].indexOf(fee.type) === -1) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_FEE_INVALID",
    );
  }
  fee.value = fee.value === undefined ? 0 : Number(fee.value);
  if (!Number.isFinite(fee.value) || fee.value < 0) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_FEE_INVALID",
    );
  }
  if (fee.min !== undefined) fee.min = Number(fee.min);
  if (fee.max !== undefined) fee.max = Number(fee.max);
  if (
    (fee.min !== undefined && (!Number.isFinite(fee.min) || fee.min < 0)) ||
    (fee.max !== undefined && (!Number.isFinite(fee.max) || fee.max < 0)) ||
    (fee.min !== undefined && fee.max !== undefined && fee.min > fee.max)
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_FEE_INVALID",
    );
  }
  return fee;
}

function normalizeAuth(value) {
  if (value === undefined || value === null) {
    return { method: DOMAIN.authMethod.NONE };
  }
  if (!CommonService.isPlainObject(value)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_AUTH_INVALID",
    );
  }
  const auth = support.cloneJson(value);
  auth.method = CommonService.cleanUpperString(
    auth.method,
    DOMAIN.authMethod.NONE,
  );
  if (
    [DOMAIN.authMethod.NONE, DOMAIN.authMethod.PIN].indexOf(auth.method) === -1
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_AUTH_INVALID",
    );
  }
  return auth;
}

function normalizeFieldBuilder(value, required) {
  if (!Array.isArray(value) || (required && value.length === 0)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      required ? "FIELD_BUILDER_REQUIRED" : "FIELD_BUILDER_INVALID",
    );
  }

  const result = [];
  const names = {};
  const orders = {};
  for (let i = 0; i < value.length; i += 1) {
    if (!CommonService.isPlainObject(value[i])) {
      throw fieldBuilderError(i);
    }
    const field = support.cloneJson(value[i]);
    field.order = Number(field.order);
    field.name = CommonService.cleanUpperString(field.name);
    field.role = CommonService.cleanString(field.role);
    field.rule = CommonService.cleanString(field.rule).toLowerCase();
    field.source = CommonService.cleanString(field.source).toLowerCase();
    field.datatype = CommonService.cleanString(field.datatype).toLowerCase();
    field.errorCode = CommonService.cleanUpperString(field.errorCode);

    if (
      !Number.isSafeInteger(field.order) ||
      field.order < 1 ||
      !/^[A-Z][A-Z0-9_]{0,99}$/.test(field.name) ||
      !field.role ||
      ["fixed", "mapping", "query"].indexOf(field.rule) === -1 ||
      !field.source ||
      ["string", "number", "boolean", "object"].indexOf(field.datatype) ===
        -1 ||
      !field.errorCode ||
      names[field.name] ||
      orders[field.order]
    ) {
      throw fieldBuilderError(i);
    }

    if (field.rule === "fixed") {
      if (
        field.source !== "constant" ||
        !Object.prototype.hasOwnProperty.call(field, "value")
      ) {
        throw fieldBuilderError(i);
      }
    }
    if (field.rule === "mapping") {
      field.variable = CommonService.cleanString(field.variable);
      if (["body", "user"].indexOf(field.source) === -1 || !field.variable) {
        throw fieldBuilderError(i);
      }
    }
    if (field.rule === "query") {
      field.query = CommonService.cleanString(field.query);
      if (
        field.source !== "database" ||
        !/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(
          field.query,
        ) ||
        !FieldBuilderRegistryService.supports(field.query) ||
        !validQueryParams(field.params)
      ) {
        throw fieldBuilderError(i);
      }
      if (field.output !== undefined) {
        field.output = CommonService.cleanString(field.output);
      }
    }

    names[field.name] = true;
    orders[field.order] = true;
    result.push(field);
  }

  return normalizeSequentialOrder(result);
}

function fieldBuilderError(index) {
  return AppErrorService.create(
    EnvelopeService.CODE.BAD_REQUEST,
    "FIELD_BUILDER_INVALID",
    { index: index },
  );
}

function validQueryParams(params) {
  if (!Array.isArray(params)) return false;
  for (let i = 0; i < params.length; i += 1) {
    if (typeof params[i] === "string" && CommonService.cleanString(params[i])) {
      continue;
    }
    if (
      CommonService.isPlainObject(params[i]) &&
      params[i].source === "constant" &&
      Object.prototype.hasOwnProperty.call(params[i], "value")
    ) {
      continue;
    }
    if (
      CommonService.isPlainObject(params[i]) &&
      params[i].source === "field" &&
      CommonService.cleanString(params[i].name)
    ) {
      continue;
    }
    return false;
  }
  return true;
}

function normalizeGlSteps(value, required) {
  if (!Array.isArray(value) || (required && value.length === 0)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "TRANS_DEFINITION_INVALID",
    );
  }
  const result = [];
  const orders = {};
  for (let i = 0; i < value.length; i += 1) {
    const raw = value[i];
    if (!CommonService.isPlainObject(raw)) throw transDefinitionError(i);
    const step = {
      order: Number(raw.order),
      amount: CommonService.cleanUpperString(raw.amount),
      debit: normalizeLedgerTarget(raw.debit, i),
      credit: normalizeLedgerTarget(raw.credit, i),
    };
    if (
      !Number.isSafeInteger(step.order) ||
      step.order < 1 ||
      !/^[A-Z][A-Z0-9_]{0,99}$/.test(step.amount) ||
      orders[step.order]
    ) {
      throw transDefinitionError(i);
    }
    orders[step.order] = true;
    result.push(step);
  }
  return normalizeSequentialOrder(result);
}

function normalizeSequentialOrder(items) {
  const sorted = Service.sortByOrder(items);
  for (let i = 0; i < sorted.length; i += 1) {
    sorted[i].order = i + 1;
  }
  return sorted;
}

function normalizeLedgerTarget(value, index) {
  if (!CommonService.isPlainObject(value)) throw transDefinitionError(index);
  const level = CommonService.cleanString(value.level);
  const target = CommonService.cleanString(value.target);
  if (
    [DOMAIN.ledgerLevel.PRODUCT, DOMAIN.ledgerLevel.WALLET].indexOf(level) ===
      -1 ||
    !target
  ) {
    throw transDefinitionError(index);
  }
  if (
    level === DOMAIN.ledgerLevel.PRODUCT &&
    !/^[A-Z][A-Z0-9_]{0,99}$/.test(target)
  ) {
    throw transDefinitionError(index);
  }
  return { level: level, target: target };
}

function transDefinitionError(index) {
  return AppErrorService.create(
    EnvelopeService.CODE.BAD_REQUEST,
    "TRANS_DEFINITION_INVALID",
    { index: index },
  );
}

function buildAvailableFieldMap(fieldBuilder) {
  const builtInFields = [
    "TRANSREFID",
    "SERVICEID",
    "SERVICECODE",
    "USERTYPE",
    "USERID",
    "OFFICERID",
    "USERROLE",
  ];
  const result = {};
  for (let i = 0; i < builtInFields.length; i += 1) {
    result[builtInFields[i]] = true;
  }
  for (let j = 0; j < fieldBuilder.length; j += 1) {
    result[fieldBuilder[j].name] = true;
  }
  return result;
}

function validateDefinitionTargetField(target, availableFields, step) {
  if (
    target.level === DOMAIN.ledgerLevel.PRODUCT &&
    !availableFields[target.target]
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "TRANS_DEFINITION_FIELD_UNKNOWN",
      { step: step, fieldName: target.target },
    );
  }
}
