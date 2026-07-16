var DOMAIN = require("../../config/domain").domain;
var configuration = require("./OfficerServiceConfigurationService");
var transFields = require("./OfficerTransFieldService");
var transValidations = require("./OfficerTransValidationService");
var support = require("./OfficerServiceSupportService");

module.exports = {
  create: create,
  list: list,
  detail: detail,
  update: update,
  publish: publish,
  unpublish: unpublish,
};

async function create(body, officer) {
  body = support.asObject(body);
  const values = configuration.normalizeServiceCreate(body);
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
    if (support.isDuplicateKeyError(err)) {
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "SERVICE_ALREADY_EXISTS",
      );
    }
    throw err;
  }

  return { service: support.serializeService(service) };
}

async function list(body) {
  body = support.asObject(body);
  const paging = RequestQueryService.normalizePaging(body);
  const criteria = buildServiceCriteria(body);
  const sort = normalizeServiceSort(body);
  const total = await Service.count(criteria);
  const services = await Service.find(criteria)
    .sort(sort)
    .skip(paging.skip)
    .limit(paging.pageSize);

  return {
    items: services.map(support.serializeService),
    pagination: support.paginationResult(paging, total),
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
}

async function detail(body) {
  const service = await support.loadService(body);
  return { service: support.serializeService(service) };
}

async function update(body, officer) {
  body = support.asObject(body);
  const service = await support.loadService(body);
  support.assertConfigEditable(service);
  const updates = configuration.normalizeServiceUpdate(body, service);
  updates.updatedBy = String(officer.id);

  if (!support.hasChanged(service, updates, ["updatedBy"])) {
    return { service: support.serializeService(service), changed: false };
  }

  const rows = await Service.update({ id: service.id }, updates);
  return {
    service: support.serializeService(
      support.requireUpdated(rows, "OFFICER_SERVICE_UPDATE_FAILED"),
    ),
    changed: true,
  };
}

async function publish(body, officer) {
  const service = await support.loadService(body);
  if (service.status === DOMAIN.status.ACTIVE) {
    return { service: support.serializeService(service), changed: false };
  }

  await validatePublishable(service);
  const rows = await Service.update(
    { id: service.id, status: service.status },
    { status: DOMAIN.status.ACTIVE, updatedBy: String(officer.id) },
  );
  if (!rows || !rows[0]) {
    const current = await Service.findOne({ id: service.id });
    if (current && current.status === DOMAIN.status.ACTIVE) {
      return { service: support.serializeService(current), changed: false };
    }
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "SERVICE_PUBLISH_FAILED",
    );
  }
  return { service: support.serializeService(rows[0]), changed: true };
}

async function unpublish(body, officer) {
  const service = await support.loadService(body);
  if (service.status === DOMAIN.status.INACTIVE) {
    return { service: support.serializeService(service), changed: false };
  }

  const rows = await Service.update(
    { id: service.id, status: service.status },
    { status: DOMAIN.status.INACTIVE, updatedBy: String(officer.id) },
  );
  if (!rows || !rows[0]) {
    const current = await Service.findOne({ id: service.id });
    if (current && current.status === DOMAIN.status.INACTIVE) {
      return { service: support.serializeService(current), changed: false };
    }
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "SERVICE_UNPUBLISH_FAILED",
    );
  }
  return { service: support.serializeService(rows[0]), changed: true };
}

async function validatePublishable(service) {
  configuration.normalizeServiceName(service.name);
  configuration.normalizeFee(service.fee);
  configuration.normalizeAuth(service.auth);
  const fieldBuilder = configuration.normalizeFieldBuilder(
    service.fieldBuilder,
    true,
  );
  const availableFields =
    configuration.buildAvailableFieldMap(fieldBuilder);

  const fields = await TransField.find({
    service: String(service.id),
    status: DOMAIN.status.ACTIVE,
  });
  if (!fields.length) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "SERVICE_TRANS_FIELDS_REQUIRED",
    );
  }
  for (let i = 0; i < fields.length; i += 1) {
    transFields.validate(fields[i]);
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
    status: DOMAIN.status.ACTIVE,
  });
  for (let j = 0; j < validations.length; j += 1) {
    transValidations.validate(validations[j]);
  }

  const definition = await TransDefinition.findOne({
    service: String(service.id),
    status: DOMAIN.status.ACTIVE,
  });
  if (!definition) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "TRANS_DEFINITION_NOT_FOUND",
    );
  }
  const glSteps = configuration.normalizeGlSteps(definition.glSteps, true);
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
    configuration.validateDefinitionTargetField(
      glSteps[k].debit,
      definitionFields,
      k,
    );
    configuration.validateDefinitionTargetField(
      glSteps[k].credit,
      definitionFields,
      k,
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
  if (
    status &&
    [
      DOMAIN.status.DRAFT,
      DOMAIN.status.ACTIVE,
      DOMAIN.status.INACTIVE,
    ].indexOf(status) === -1
  ) {
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
