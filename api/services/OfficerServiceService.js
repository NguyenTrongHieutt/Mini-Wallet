const SAFE_FIELD_BUILDER_QUERIES = [
  "Customer.getActiveCustomerByPhone",
  "Pocket.getActivePocketByOwner",
];

module.exports = {
  MAX_PAGE_SIZE: 100,

  create: async function (body, officer) {
    body = asObject(body);
    const values = normalizeServiceCreate(body);
    const existing = await Service.findOne({ code: values.code });
    if (existing) {
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "SERVICE_ALREADY_EXISTS",
        { serviceId: String(existing.id) },
      );
    }

    values.createdBy = String(officer.id);
    values.updatedBy = String(officer.id);
    let service;
    try {
      service = await Service.create(values);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw AppErrorService.create(
          EnvelopeService.CODE.CONFLICT,
          "SERVICE_ALREADY_EXISTS",
        );
      }
      throw err;
    }

    return { service: serializeService(service) };
  },

  list: async function (body) {
    body = asObject(body);
    const paging = normalizePaging(body);
    const criteria = buildServiceCriteria(body);
    const sort = normalizeServiceSort(body);
    const total = await Service.count(criteria);
    const services = await Service.find(criteria)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);

    return {
      items: services.map(serializeService),
      pagination: paginationResult(paging, total),
      filters: {
        q: CommonService.cleanString(body.q || body.search || body.keyword),
        code:
          CommonService.cleanUpperString(body.serviceCode || body.code) ||
          undefined,
        status:
          CommonService.cleanString(body.status).toLowerCase() || undefined,
      },
      sort: sort,
    };
  },

  detail: async function (body) {
    const service = await loadService(body);
    return { service: serializeService(service) };
  },

  update: async function (body, officer) {
    body = asObject(body);
    const service = await loadService(body);
    assertConfigEditable(service);
    const updates = normalizeServiceUpdate(body, service);
    updates.updatedBy = String(officer.id);

    if (!hasChanged(service, updates, ["updatedBy"])) {
      return { service: serializeService(service), changed: false };
    }

    const rows = await Service.update({ id: service.id }, updates);
    return {
      service: serializeService(
        requireUpdated(rows, "OFFICER_SERVICE_UPDATE_FAILED"),
      ),
      changed: true,
    };
  },

  listTransFields: async function (body) {
    body = asObject(body);
    const service = await loadService(body);
    const status = normalizeChildStatusFilter(body.status);
    const criteria = { service: String(service.id) };
    if (status) criteria.status = status;
    const items = await TransField.find(criteria).sort({
      order: 1,
      createdAt: 1,
    });

    return {
      service: serviceSummary(service),
      items: items.map(serializeTransField),
      total: items.length,
    };
  },

  insertTransField: async function (body, officer) {
    body = asObject(body);
    const service = await loadService(body);
    assertConfigEditable(service);
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
      if (isDuplicateKeyError(err)) {
        throw AppErrorService.create(
          EnvelopeService.CODE.CONFLICT,
          "TRANS_FIELD_ALREADY_EXISTS",
        );
      }
      throw err;
    }

    return {
      service: serviceSummary(service),
      transField: serializeTransField(field),
    };
  },

  updateTransField: async function (body, officer) {
    body = asObject(body);
    const service = await loadService(body);
    assertConfigEditable(service);
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
    if (!hasChanged(field, updates, ["updatedBy"])) {
      return { transField: serializeTransField(field), changed: false };
    }

    let rows;
    try {
      rows = await TransField.update({ id: field.id }, updates);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw AppErrorService.create(
          EnvelopeService.CODE.CONFLICT,
          "TRANS_FIELD_ALREADY_EXISTS",
        );
      }
      throw err;
    }
    return {
      transField: serializeTransField(
        requireUpdated(rows, "TRANS_FIELD_UPDATE_FAILED"),
      ),
      changed: true,
    };
  },

  listTransValidations: async function (body) {
    body = asObject(body);
    const service = await loadService(body);
    const status = normalizeChildStatusFilter(body.status);
    const criteria = { service: String(service.id) };
    if (status) criteria.status = status;
    const items = await TransValidation.find(criteria).sort({
      order: 1,
      createdAt: 1,
    });

    return {
      service: serviceSummary(service),
      items: items.map(serializeTransValidation),
      total: items.length,
    };
  },

  insertTransValidation: async function (body, officer) {
    body = asObject(body);
    const service = await loadService(body);
    assertConfigEditable(service);
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
      service: serviceSummary(service),
      transValidation: serializeTransValidation(validation),
    };
  },

  updateTransValidation: async function (body, officer) {
    body = asObject(body);
    const service = await loadService(body);
    assertConfigEditable(service);
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
    if (!hasChanged(validation, updates, ["updatedBy"])) {
      return {
        transValidation: serializeTransValidation(validation),
        changed: false,
      };
    }

    const rows = await TransValidation.update({ id: validation.id }, updates);
    return {
      transValidation: serializeTransValidation(
        requireUpdated(rows, "TRANS_VALIDATION_UPDATE_FAILED"),
      ),
      changed: true,
    };
  },

  updateFieldBuilder: async function (body, officer) {
    body = asObject(body);
    const service = await loadService(body);
    assertConfigEditable(service);
    if (!Object.prototype.hasOwnProperty.call(body, "fieldBuilder")) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "FIELD_BUILDER_REQUIRED",
      );
    }
    const fieldBuilder = normalizeFieldBuilder(body.fieldBuilder, true);
    const updates = {
      fieldBuilder: fieldBuilder,
      updatedBy: String(officer.id),
    };

    if (!hasChanged(service, updates, ["updatedBy"])) {
      return { service: serializeService(service), changed: false };
    }

    const rows = await Service.update({ id: service.id }, updates);
    return {
      service: serializeService(
        requireUpdated(rows, "FIELD_BUILDER_UPDATE_FAILED"),
      ),
      changed: true,
    };
  },

  updateActions: async function (body, officer) {
    body = asObject(body);
    const service = await loadService(body);
    assertConfigEditable(service);
    const actions = buildActionsUpdate(body, service.actions || {});
    const updates = {
      actions: actions,
      updatedBy: String(officer.id),
    };

    if (!hasChanged(service, updates, ["updatedBy"])) {
      return { service: serializeService(service), changed: false };
    }

    const rows = await Service.update({ id: service.id }, updates);
    return {
      service: serializeService(
        requireUpdated(rows, "SERVICE_ACTIONS_UPDATE_FAILED"),
      ),
      changed: true,
    };
  },

  detailTransDefinition: async function (body) {
    const service = await loadService(body);
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
      service: serviceSummary(service),
      transDefinition: serializeTransDefinition(definition),
    };
  },

  updateTransDefinition: async function (body, officer) {
    body = asObject(body);
    const service = await loadService(body);
    assertConfigEditable(service);
    const glSteps = normalizeGlSteps(body.glSteps, true);
    const status = normalizeChildStatus(body.status, "active");
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
      changed = hasChanged(existing, values, ["updatedBy"]);
      if (!changed) {
        definition = existing;
      } else {
        definition = requireUpdated(
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
      service: serviceSummary(service),
      transDefinition: serializeTransDefinition(definition),
      created: created,
      changed: changed,
    };
  },

  publish: async function (body, officer) {
    const service = await loadService(body);
    if (service.status === "active") {
      return { service: serializeService(service), changed: false };
    }

    await validatePublishable(service);
    const rows = await Service.update(
      { id: service.id, status: service.status },
      { status: "active", updatedBy: String(officer.id) },
    );
    if (!rows || !rows[0]) {
      const current = await Service.findOne({ id: service.id });
      if (current && current.status === "active") {
        return { service: serializeService(current), changed: false };
      }
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "SERVICE_PUBLISH_FAILED",
      );
    }
    return { service: serializeService(rows[0]), changed: true };
  },

  unpublish: async function (body, officer) {
    const service = await loadService(body);
    if (service.status === "inactive") {
      return { service: serializeService(service), changed: false };
    }

    const rows = await Service.update(
      { id: service.id, status: service.status },
      { status: "inactive", updatedBy: String(officer.id) },
    );
    if (!rows || !rows[0]) {
      const current = await Service.findOne({ id: service.id });
      if (current && current.status === "inactive") {
        return { service: serializeService(current), changed: false };
      }
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "SERVICE_UNPUBLISH_FAILED",
      );
    }
    return { service: serializeService(rows[0]), changed: true };
  },
};

function asObject(value) {
  return CommonService.isPlainObject(value) ? value : {};
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
    status: "draft",
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
      if (allowed[i] === "actions")
        updates.actions = normalizeActions(body.actions);
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
  return cloneJson(value);
}

function buildActionsUpdate(body, currentActions) {
  if (Object.prototype.hasOwnProperty.call(body, "actions")) {
    return normalizeActions(body.actions);
  }

  const actionName = CommonService.cleanString(body.actionName).toLowerCase();
  const supportedActions = ["provider", "request", "confirm", "verify"];
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
  actions[actionName] = cloneJson(body.action);
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
  const fee = cloneJson(value);
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
  if (value === undefined || value === null) return { method: "NONE" };
  if (!CommonService.isPlainObject(value)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_AUTH_INVALID",
    );
  }
  const auth = cloneJson(value);
  auth.method = CommonService.cleanUpperString(auth.method, "NONE");
  if (["NONE", "PIN"].indexOf(auth.method) === -1) {
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
    const field = cloneJson(value[i]);
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
        SAFE_FIELD_BUILDER_QUERIES.indexOf(field.query) === -1 ||
        !validQueryParams(field.params)
      ) {
        throw fieldBuilderError(i);
      }
      if (field.output !== undefined)
        field.output = CommonService.cleanString(field.output);
    }

    names[field.name] = true;
    orders[field.order] = true;
    result.push(field);
  }

  return Service.sortByOrder(result);
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

function normalizeTransField(body) {
  const field = {
    fieldName: CommonService.cleanUpperString(body.fieldName),
    fieldFormat: CommonService.cleanString(body.fieldFormat).toLowerCase(),
    isRequired: normalizeBoolean(body.isRequired, false, "TRANS_FIELD_INVALID"),
    needSecured: normalizeBoolean(
      body.needSecured,
      false,
      "TRANS_FIELD_INVALID",
    ),
    order: normalizePositiveInteger(body.order, "TRANS_FIELD_INVALID"),
    status: normalizeChildStatus(body.status, "active"),
  };
  if (body.minLength !== undefined && body.minLength !== null) {
    field.minLength = normalizeNonNegativeInteger(
      body.minLength,
      "TRANS_FIELD_INVALID",
    );
  }
  if (body.maxLength !== undefined && body.maxLength !== null) {
    field.maxLength = normalizeNonNegativeInteger(
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

function normalizeTransValidation(body) {
  const validation = {
    validateFunc: CommonService.cleanString(body.validateFunc),
    validateFields: CommonService.cleanString(body.validateFields),
    order: normalizePositiveInteger(body.order, "TRANS_VALIDATION_INVALID"),
    errorCode: CommonService.cleanUpperString(body.errorCode) || undefined,
    status: normalizeChildStatus(body.status, "active"),
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
  const supported = [
    "validateReceiverIsNotSender",
    "validateSenderAccountSufficiency",
    "validateRole",
    "validateUserRole",
    "validateFieldRole",
    "checkRole",
    "checkUserRole",
  ];
  if (
    supported.indexOf(validation.validateFunc) === -1 ||
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
      if (!CommonService.isPlainObject(config))
        throw new Error("object required");
    } catch (err) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "VALIDATION_CONFIG_INVALID",
      );
    }
  }
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
  return Service.sortByOrder(result);
}

function normalizeLedgerTarget(value, index) {
  if (!CommonService.isPlainObject(value)) throw transDefinitionError(index);
  const level = CommonService.cleanString(value.level);
  const target = CommonService.cleanString(value.target);
  if (["productLevel", "wallet"].indexOf(level) === -1 || !target) {
    throw transDefinitionError(index);
  }
  if (level === "productLevel" && !/^[A-Z][A-Z0-9_]{0,99}$/.test(target)) {
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

async function validatePublishable(service) {
  normalizeServiceName(service.name);
  normalizeFee(service.fee);
  normalizeAuth(service.auth);
  const fieldBuilder = normalizeFieldBuilder(service.fieldBuilder, true);
  const availableFields = buildAvailableFieldMap(fieldBuilder);

  const fields = await TransField.find({
    service: String(service.id),
    status: "active",
  });
  if (!fields.length) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "SERVICE_TRANS_FIELDS_REQUIRED",
    );
  }
  for (let i = 0; i < fields.length; i += 1) {
    validateTransField(fields[i]);
    if (!availableFields[fields[i].fieldName]) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "SERVICE_TRANS_FIELD_UNBUILT",
        { fieldName: fields[i].fieldName },
      );
    }
  }

  const validations = await TransValidation.find({
    service: String(service.id),
    status: "active",
  });
  for (let j = 0; j < validations.length; j += 1) {
    validateTransValidation(validations[j]);
  }

  const definition = await TransDefinition.findOne({
    service: String(service.id),
    status: "active",
  });
  if (!definition) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "TRANS_DEFINITION_NOT_FOUND",
    );
  }
  const glSteps = normalizeGlSteps(definition.glSteps, true);
  const definitionFields = Object.assign({}, availableFields, {
    DEBITFEE: true,
    TOTALAMOUNT: true,
  });
  for (let k = 0; k < glSteps.length; k += 1) {
    if (!definitionFields[glSteps[k].amount]) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANS_DEFINITION_FIELD_UNKNOWN",
        { step: k, fieldName: glSteps[k].amount },
      );
    }
    validateDefinitionTargetField(glSteps[k].debit, definitionFields, k);
    validateDefinitionTargetField(glSteps[k].credit, definitionFields, k);
  }
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
  for (let i = 0; i < builtInFields.length; i += 1)
    result[builtInFields[i]] = true;
  for (let j = 0; j < fieldBuilder.length; j += 1)
    result[fieldBuilder[j].name] = true;
  return result;
}

function validateDefinitionTargetField(target, availableFields, step) {
  if (target.level === "productLevel" && !availableFields[target.target]) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "TRANS_DEFINITION_FIELD_UNKNOWN",
      { step: step, fieldName: target.target },
    );
  }
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

function assertConfigEditable(service) {
  if (service.status === "active") {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "SERVICE_CONFIG_ACTIVE",
    );
  }
}

function buildServiceCriteria(body) {
  const criteria = {};
  const code = CommonService.cleanUpperString(body.serviceCode || body.code);
  const status = CommonService.cleanString(body.status).toLowerCase();
  const search = CommonService.cleanString(
    body.q || body.search || body.keyword,
  );
  if (status && ["draft", "active", "inactive"].indexOf(status) === -1) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_STATUS_INVALID",
    );
  }
  if (code) criteria.code = code;
  if (status) criteria.status = status;
  if (search) {
    criteria.or = [
      { code: { contains: search } },
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }
  return criteria;
}

function normalizePaging(body) {
  const requestedPage = Number(body.page || 1);
  const requestedPageSize = Number(body.pageSize || body.limit || 20);
  const page = Number.isFinite(requestedPage)
    ? Math.max(Math.floor(requestedPage), 1)
    : 1;
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(
        Math.max(Math.floor(requestedPageSize), 1),
        module.exports.MAX_PAGE_SIZE,
      )
    : 20;
  return { page: page, pageSize: pageSize, skip: (page - 1) * pageSize };
}

function normalizeServiceSort(body) {
  const allowed = ["code", "name", "status", "createdAt", "updatedAt"];
  const sortBy =
    allowed.indexOf(body.sortBy) === -1 ? "createdAt" : body.sortBy;
  const direction =
    CommonService.cleanUpperString(body.sortOrder, "DESC") === "ASC" ? 1 : -1;
  const sort = {};
  sort[sortBy] = direction;
  return sort;
}

function normalizeChildStatusFilter(value) {
  const status = CommonService.cleanString(value).toLowerCase();
  if (status && ["active", "inactive"].indexOf(status) === -1) {
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
  if (["active", "inactive"].indexOf(status) === -1) {
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
    if (JSON.stringify(source[keys[i]]) !== JSON.stringify(updates[keys[i]]))
      return true;
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
