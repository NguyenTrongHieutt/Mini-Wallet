const http = require("http");
const https = require("https");
const url = require("url");

module.exports = {
  attributes: {
    code: {
      type: "string",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    fieldBuilder: {
      type: "array",
      required: true,
    },
    actions: {
      type: "json",
    },
    fee: {
      type: "json",
      required: true,
    },
    auth: {
      type: "json",
      required: true,
    },
    status: {
      type: "string",
      enum: ["draft", "active", "inactive"],
      defaultsTo: "draft",
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

  loadActiveByCode: async function (serviceCode) {
    const service = await Service.findOne({ code: serviceCode });

    if (!service) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "SERVICE_NOT_FOUND",
      );
    }

    if (service.status !== "active") {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "SERVICE_INACTIVE",
      );
    }

    return service;
  },

  loadActiveById: async function (serviceId) {
    const service = await Service.findOne({ id: serviceId });

    if (!service) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "SERVICE_NOT_FOUND",
      );
    }

    if (service.status !== "active") {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "SERVICE_INACTIVE",
      );
    }

    return service;
  },

  buildTransactionFields: async function (service, transInput, trail) {
    const transBody = {
      TRANSREFID: String(trail.id),
      SERVICEID: String(service.id),
      SERVICECODE: service.code,
    };

    const fieldBuilder = this.sortByOrder(service.fieldBuilder || []);
    for (let i = 0; i < fieldBuilder.length; i += 1) {
      const field = fieldBuilder[i];
      transBody[field.name] = await resolveField(field, transInput, transBody);
    }

    transBody.TRANSREFID = String(trail.id);
    transBody.SERVICEID = String(service.id);
    transBody.SERVICECODE = service.code;

    return transBody;
  },

  calculateFee: function (service, transBody) {
    const amount = Number(transBody.AMOUNT);
    const feeConfig = service.fee || { type: "fixed", value: 0 };
    let fee = 0;

    if (feeConfig.type === "fixed") {
      fee = Number(feeConfig.value || 0);
    } else if (feeConfig.type === "percent") {
      fee = Math.ceil((amount * Number(feeConfig.value || 0)) / 100);
      if (feeConfig.max !== undefined) {
        fee = Math.min(fee, Number(feeConfig.max));
      }
      if (feeConfig.min !== undefined) {
        fee = Math.max(fee, Number(feeConfig.min));
      }
    }

    transBody.AMOUNT = amount;
    transBody.DEBITFEE = fee;
    transBody.TOTALAMOUNT = amount + fee;
  },

  buildPreview: function (trail, service, transBody) {
    return {
      transRefId: String(trail.id),
      service: {
        id: String(service.id),
        code: service.code,
        name: service.name,
      },
      amount: transBody.AMOUNT,
      fee: transBody.DEBITFEE,
      totalAmount: transBody.TOTALAMOUNT,
      currency: transBody.CURRENCY || "VND",
      input: trail.inputMessage,
      status: trail.status,
      expiredAt: trail.expiredAt,
    };
  },

  buildConfirmResult: function (trail, service) {
    const auth = service.auth || {};

    return {
      transRefId: String(trail.id),
      service: {
        id: String(service.id),
        code: service.code,
        name: service.name,
      },
      authMethod: auth.method || "NONE",
      status: trail.status,
      expiredAt: trail.expiredAt,
    };
  },

  runRequestAction: async function (service, transBody) {
    return runAction(service, transBody, "request", "requestUrl");
  },

  runConfirmAction: async function (service, transBody) {
    return runAction(service, transBody, "confirm", "confirmUrl");
  },

  sortByOrder: function (items) {
    return (items || []).sort(function (a, b) {
      return Number(a.order || 0) - Number(b.order || 0);
    });
  },
};

async function resolveField(field, transInput, transBody) {
  if (field.rule === "fixed") {
    return field.value;
  }

  if (field.rule === "mapping") {
    return resolveMapping(field, transInput);
  }

  if (field.rule === "query") {
    return resolveQuery(field, transBody);
  }

  throw AppErrorService.create(
    EnvelopeService.CODE.BAD_REQUEST,
    "UNSUPPORTED_FIELD_BUILDER_RULE",
    { field: field.name, rule: field.rule },
  );
}

function resolveMapping(field, transInput) {
  let source = {};

  if (field.source === "body") {
    source = transInput.body || {};
  } else if (field.source === "user") {
    source = transInput.user || {};
  }

  const value = source[field.variable];
  if (
    (value === undefined || value === null || value === "") &&
    field.defaultValue !== undefined
  ) {
    return field.defaultValue;
  }

  return value;
}

async function resolveQuery(field, transBody) {
  const params = (field.params || []).map(function (name) {
    return resolveQueryParam(name, transBody);
  });
  const queryHandler = resolveQueryHandler(field.query);

  if (!queryHandler) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "UNSUPPORTED_FIELD_BUILDER_QUERY",
      { field: field.name, query: field.query },
    );
  }

  const result = await queryHandler.fn.apply(
    queryHandler.context,
    params.concat([transBody, field]),
  );

  if (!result) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      field.errorCode || "TRANSACTION_FIELD_BUILD_FAILED",
      { field: field.name },
    );
  }

  return field.output ? result[field.output] : result;
}

function resolveQueryParam(param, transBody) {
  if (param && typeof param === "object") {
    if (param.source === "constant") {
      return param.value;
    }

    if (param.source === "field") {
      return transBody[param.name];
    }
  }

  return transBody[param];
}

function resolveQueryHandler(queryPath) {
  const parts = String(queryPath || "").split(".");
  let target = global;
  let context = null;

  for (let i = 0; i < parts.length; i += 1) {
    if (!parts[i] || !target) {
      return null;
    }

    context = target;
    target = target[parts[i]];
  }

  if (typeof target !== "function") {
    return null;
  }

  return {
    context: context,
    fn: target,
  };
}

async function runAction(service, transBody, actionName, defaultUrlField) {
  const action = service.actions && service.actions[actionName];
  if (!action || action.enabled !== true) {
    return null;
  }

  const provider = await loadActionProvider(
    service.actions.provider,
    transBody,
  );
  const actionUrl = getActionUrl(provider, action, defaultUrlField);
  const requestBody = buildMappedObject(
    action.requestMap,
    transBody,
    transBody,
  );
  const response = await callJsonAction(
    actionUrl,
    action.method || "POST",
    requestBody,
    action,
  );

  validateActionSuccess(response, action);
  applyResponseMap(action.responseMap, response, transBody);

  return {
    provider: provider,
    request: requestBody,
    response: response,
  };
}

async function loadActionProvider(providerConfig, transBody) {
  const providerCode = resolveProviderCode(providerConfig, transBody);
  if (!providerCode) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_CODE_REQUIRED",
    );
  }

  const provider = await Provider.findOne({
    code: providerCode,
    status: "active",
  });
  if (!provider) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "PROVIDER_NOT_FOUND",
      { providerCode: providerCode },
    );
  }

  return provider;
}

function resolveProviderCode(providerConfig, transBody) {
  providerConfig = providerConfig || {};

  if (providerConfig.codeSource === "FIXED") {
    return providerConfig.codeValue;
  }

  const codeField = providerConfig.codeField || "PROVIDERCODE";
  return transBody && transBody[codeField];
}

function getActionUrl(provider, action, defaultUrlField) {
  const urlField = action.urlField || defaultUrlField;
  const actionUrl = provider[urlField];

  if (!actionUrl) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_ACTION_URL_REQUIRED",
      { providerCode: provider.code, urlField: urlField },
    );
  }

  return actionUrl;
}

function buildMappedObject(mapConfig, source, defaultValue) {
  if (!mapConfig) {
    return defaultValue || {};
  }

  const mapped = {};
  const keys = Object.keys(mapConfig);
  for (let i = 0; i < keys.length; i += 1) {
    const targetKey = keys[i];
    mapped[targetKey] = getPathValue(source, mapConfig[targetKey]);
  }

  return mapped;
}

function applyResponseMap(responseMap, response, transBody) {
  if (!responseMap) {
    return;
  }

  const responseBody = unwrapActionResponse(response);
  const keys = Object.keys(responseMap);
  for (let i = 0; i < keys.length; i += 1) {
    const transBodyField = keys[i];
    const responsePath = responseMap[transBodyField];
    const value = getPathValue(responseBody, responsePath);

    if (value !== undefined) {
      transBody[transBodyField] = value;
    }
  }
}

function unwrapActionResponse(response) {
  if (
    response &&
    typeof response === "object" &&
    response.data !== undefined &&
    response.err !== undefined
  ) {
    return response.data;
  }

  return response;
}

function getPathValue(source, path) {
  if (path === undefined || path === null || path === "") {
    return undefined;
  }

  if (typeof path !== "string") {
    return path;
  }

  const parts = path.split(".");
  let value = source;
  for (let i = 0; i < parts.length; i += 1) {
    if (value === undefined || value === null) {
      return undefined;
    }

    value = value[parts[i]];
  }

  return value;
}

function validateActionSuccess(response, action) {
  const successRule = action.successRule;
  if (!successRule) {
    if (
      response &&
      typeof response === "object" &&
      response.err !== undefined &&
      Number(response.err) !== EnvelopeService.CODE.OK
    ) {
      throwProviderActionFailed(response, action);
    }

    return;
  }

  const value = getPathValue(response, successRule.field);
  if (successRule.equals !== undefined && value !== successRule.equals) {
    throwProviderActionFailed(response, action);
  }
  if (successRule.notEquals !== undefined && value === successRule.notEquals) {
    throwProviderActionFailed(response, action);
  }
  if (successRule.in && successRule.in.indexOf(value) === -1) {
    throwProviderActionFailed(response, action);
  }
}

function throwProviderActionFailed(response, action) {
  throw AppErrorService.create(
    EnvelopeService.CODE.BAD_REQUEST,
    action.errorCode || "PROVIDER_ACTION_FAILED",
    { response: response },
  );
}

function callJsonAction(actionUrl, method, requestBody, action) {
  return new Promise(function (resolve, reject) {
    const parsedUrl = url.parse(actionUrl);
    if (
      !parsedUrl.hostname ||
      ["http:", "https:"].indexOf(parsedUrl.protocol) === -1
    ) {
      return reject(
        AppErrorService.create(
          EnvelopeService.CODE.BAD_REQUEST,
          "PROVIDER_ACTION_URL_REQUIRED",
          { url: actionUrl },
        ),
      );
    }

    const transport = parsedUrl.protocol === "https:" ? https : http;
    const payload = JSON.stringify(requestBody || {});
    const normalizedMethod = String(method || "POST").toUpperCase();
    const headers = {
      "Content-Type": "application/json",
    };

    if (normalizedMethod !== "GET") {
      headers["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = transport.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: normalizedMethod,
        timeout: Number(action.timeoutMs || 10000),
        headers: headers,
      },
      function (res) {
        let rawBody = "";

        res.setEncoding("utf8");
        res.on("data", function (chunk) {
          rawBody += chunk;
        });
        res.on("end", function () {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(
              AppErrorService.create(
                EnvelopeService.CODE.BAD_REQUEST,
                action.errorCode || "PROVIDER_ACTION_FAILED",
                { statusCode: res.statusCode, response: rawBody },
              ),
            );
          }

          try {
            return resolve(rawBody ? JSON.parse(rawBody) : {});
          } catch (err) {
            return reject(
              AppErrorService.create(
                EnvelopeService.CODE.BAD_REQUEST,
                "PROVIDER_RESPONSE_INVALID",
                { response: rawBody },
              ),
            );
          }
        });
      },
    );

    req.on("timeout", function () {
      req.abort();
      reject(
        AppErrorService.create(
          EnvelopeService.CODE.BAD_REQUEST,
          action.errorCode || "PROVIDER_ACTION_TIMEOUT",
        ),
      );
    });
    req.on("error", function (err) {
      reject(
        AppErrorService.create(
          EnvelopeService.CODE.BAD_REQUEST,
          action.errorCode || "PROVIDER_ACTION_FAILED",
          { message: err.message },
        ),
      );
    });

    if (normalizedMethod !== "GET") {
      req.write(payload);
    }
    req.end();
  });
}
