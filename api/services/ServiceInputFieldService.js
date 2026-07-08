module.exports = {
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

    const service = await Service.loadActiveByCode(serviceCode);
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

async function loadTransFieldMap(service) {
  const fields = await TransField.find({
    service: String(service.id),
    status: "active",
  });
  const map = {};

  for (let i = 0; i < fields.length; i += 1) {
    map[fields[i].fieldName] = fields[i];
  }

  return map;
}

function buildBodyFields(service, transFields) {
  const fieldBuilder = Service.sortByOrder(service.fieldBuilder || []);
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
  const fieldBuilder = Service.sortByOrder(service.fieldBuilder || []);

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
    return "0900000000";
  }
  if (dataType === "number" || dataType === "integer" || dataType === "int") {
    return 10000;
  }
  if (dataType === "boolean" || dataType === "bool") {
    return true;
  }
  if (dataType === "object" || dataType === "json") {
    return {};
  }

  return "";
}
