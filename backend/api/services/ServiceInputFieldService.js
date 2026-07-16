var DOMAIN = require("../../config/domain").domain;

module.exports = {
  listActiveServices: async function (body) {
    const paging = normalizePaging(body);
    const criteria = buildServiceCriteria(body);
    const sort = normalizeSort(body, ["code", "name", "createdAt"], "name");

    const total = await Service.count(criteria);
    const services = await Service.find(criteria)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);

    return {
      items: services.map(buildPublicService),
      pagination: buildPagination(paging, total),
      filters: {
        code: body.code || body.serviceCode,
        q: body.q || body.search || body.keyword,
      },
      sort: sort,
    };
  },

  listActiveProviders: async function (body) {
    const paging = normalizePaging(body);
    const serviceCode = CommonService.cleanUpperString(
      body.serviceCode || body.codeService || body.SERVICECODE,
    );

    if (!serviceCode) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "SERVICE_CODE_REQUIRED",
      );
    }

    const criteria = buildProviderCriteria(body, serviceCode);
    const sort = normalizeSort(
      body,
      ["code", "name", "category", "type", "createdAt"],
      "name",
    );

    const total = await Provider.count(criteria);
    const providers = await Provider.find(criteria)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);

    return {
      items: providers.map(buildPublicProvider),
      pagination: buildPagination(paging, total),
      filters: {
        serviceCode: serviceCode,
        code: body.code || body.providerCode,
        type: body.type,
        category: body.category,
        q: body.q || body.search || body.keyword,
      },
      sort: sort,
    };
  },

  getRequestInputFields: async function (body) {
    const serviceCode = CommonService.cleanUpperString(
      body.serviceCode || body.SERVICECODE || body.code,
    );

    if (!serviceCode) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "SERVICE_CODE_REQUIRED",
      );
    }

    const service = await ServiceRuntimeService.loadActiveByCode(serviceCode);
    const transFields = await loadTransFieldMap(service);
    const bodyFields = buildBodyFields(service, transFields);

    return {
      service: {
        id: String(service.id),
        code: service.code,
        name: service.name,
        description: service.description,
      },
      endpoint: {
        method: "POST",
        path: "/api/v1/transactions/request",
      },
      bodyFields: bodyFields,
      requestExample: buildRequestExample(service, bodyFields),
    };
  },
};

function buildServiceCriteria(body) {
  const criteria = {
    status: DOMAIN.status.ACTIVE,
  };
  const code = CommonService.cleanUpperString(body.code || body.serviceCode);
  const search = CommonService.cleanString(
    body.q || body.search || body.keyword,
  );

  if (code) {
    criteria.code = code;
  }

  if (search) {
    criteria.or = [
      { code: { contains: search } },
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  return criteria;
}

function buildProviderCriteria(body, serviceCode) {
  const criteria = {
    serviceCode: serviceCode,
    status: DOMAIN.status.ACTIVE,
  };
  const providerCode = CommonService.cleanUpperString(
    body.providerCode || body.code,
  );
  const type = CommonService.cleanString(body.type);
  const category = CommonService.cleanString(body.category);
  const search = CommonService.cleanString(
    body.q || body.search || body.keyword,
  );

  if (providerCode) {
    criteria.code = providerCode;
  }
  if (type) {
    criteria.type = type;
  }
  if (category) {
    criteria.category = category;
  }
  if (search) {
    criteria.or = [
      { code: { contains: search } },
      { name: { contains: search } },
      { category: { contains: search } },
      { type: { contains: search } },
    ];
  }

  return criteria;
}

function normalizePaging(body) {
  return RequestQueryService.normalizePaging(body);
}

function normalizeSort(body, allowed, defaultField) {
  const sortBy = CommonService.cleanString(body.sortBy || defaultField);
  const field = allowed.indexOf(sortBy) === -1 ? defaultField : sortBy;
  const direction = CommonService.cleanString(
    body.sortOrder || body.order || "ASC",
  ).toUpperCase();

  return field + " " + (direction === "DESC" ? "DESC" : "ASC");
}

function buildPagination(paging, total) {
  return {
    page: paging.page,
    pageSize: paging.pageSize,
    total: total,
    totalPages: Math.ceil(total / paging.pageSize),
  };
}

function buildPublicService(service) {
  return {
    id: String(service.id),
    code: service.code,
    name: service.name,
    description: service.description,
    status: service.status,
  };
}

function buildPublicProvider(provider) {
  return {
    id: String(provider.id),
    serviceCode: provider.serviceCode,
    type: provider.type,
    code: provider.code,
    name: provider.name,
    category: provider.category,
    status: provider.status,
  };
}

async function loadTransFieldMap(service) {
  const fields = await TransField.find({
    service: String(service.id),
    status: DOMAIN.status.ACTIVE,
  });
  const map = {};

  for (let i = 0; i < fields.length; i += 1) {
    map[fields[i].fieldName] = fields[i];
  }

  return map;
}

function buildBodyFields(service, transFields) {
  const fieldBuilder = ServiceRuntimeService.sortByOrder(
    service.fieldBuilder || [],
  );
  const bodyFields = [];
  const seen = {};

  for (let i = 0; i < fieldBuilder.length; i += 1) {
    const builder = fieldBuilder[i];
    if (builder.rule !== "mapping" || builder.source !== "body") {
      continue;
    }

    const bodyKey = builder.variable || builder.name;
    if (!bodyKey || seen[bodyKey]) {
      continue;
    }
    seen[bodyKey] = true;

    bodyFields.push(buildBodyField(builder, transFields[builder.name]));
  }

  return bodyFields;
}

function buildBodyField(builder, transField) {
  const requiredByBuilder = builder.defaultValue === undefined;

  return {
    name: builder.variable || builder.name,
    transField: builder.name,
    role: builder.role,
    dataType: builder.datatype || (transField && transField.fieldFormat),
    required: transField ? !!transField.isRequired : requiredByBuilder,
    defaultValue: builder.defaultValue,
    validation: transField
      ? {
          format: transField.fieldFormat,
          minLength: transField.minLength,
          maxLength: transField.maxLength,
          regex: transField.regex,
          needSecured: transField.needSecured,
          errorCode: transField.errorCode,
        }
      : null,
    errorCode: builder.errorCode,
  };
}

function buildTransFields(service, transFields) {
  const fieldBuilder = ServiceRuntimeService.sortByOrder(
    service.fieldBuilder || [],
  );

  return fieldBuilder.map(function (builder) {
    const transField = transFields[builder.name];

    return {
      name: builder.name,
      role: builder.role,
      rule: builder.rule,
      source: builder.source,
      variable: builder.variable,
      query: builder.query,
      dataType: builder.datatype || (transField && transField.fieldFormat),
      builtFromRequestBody:
        builder.rule === "mapping" && builder.source === "body",
      validation: transField
        ? {
            format: transField.fieldFormat,
            required: transField.isRequired,
            minLength: transField.minLength,
            maxLength: transField.maxLength,
            regex: transField.regex,
            needSecured: transField.needSecured,
            errorCode: transField.errorCode,
          }
        : null,
    };
  });
}

function buildRequestExample(service, bodyFields) {
  const example = {
    serviceCode: service.code,
  };

  for (let i = 0; i < bodyFields.length; i += 1) {
    example[bodyFields[i].name] = exampleValue(bodyFields[i]);
  }

  return example;
}

function exampleValue(field) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  const dataType = CommonService.cleanString(field.dataType).toLowerCase();
  if (field.name.toLowerCase().indexOf("phone") !== -1) {
    return "";
  }
  if (dataType === "number" || dataType === "integer" || dataType === "int") {
    return 0;
  }
  if (dataType === "boolean" || dataType === "bool") {
    return true;
  }
  if (dataType === "object" || dataType === "json") {
    return {};
  }

  return "";
}
