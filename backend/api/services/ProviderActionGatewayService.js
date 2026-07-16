"use strict";

var http = require("http");
var https = require("https");
var url = require("url");
var DOMAIN = require("../../config/domain").domain;

module.exports = {
  run: async function (service, transBody, actionName, defaultUrlField) {
    var action = service.actions && service.actions[actionName];
    if (!action || action.enabled !== true) {
      return null;
    }

    var provider = await loadActionProvider(
      service,
      service.actions.provider,
      transBody,
    );
    var actionUrl = getActionUrl(provider, action, defaultUrlField);
    var requestBody = buildMappedObject(
      action.requestMap,
      transBody,
      transBody,
    );
    var response = await callJsonAction(
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
  },

  timeoutMs: function (action) {
    var configuredTimeout =
      MiniWalletConfigService.transactions().providerTimeoutMs;
    return Number((action && action.timeoutMs) || configuredTimeout);
  },
};

async function loadActionProvider(service, providerConfig, transBody) {
  var providerCode = resolveProviderCode(providerConfig, transBody);
  if (!providerCode) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_CODE_REQUIRED",
    );
  }

  var serviceCode = CommonService.cleanUpperString(service.code);
  var provider = await Provider.findOne({
    code: providerCode,
    serviceCode: serviceCode,
    status: DOMAIN.status.ACTIVE,
  });
  if (!provider) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "PROVIDER_NOT_FOUND",
      { providerCode: providerCode, serviceCode: serviceCode },
    );
  }

  return provider;
}

function resolveProviderCode(providerConfig, transBody) {
  providerConfig = providerConfig || {};

  if (providerConfig.codeSource === "FIXED") {
    return providerConfig.codeValue;
  }

  var codeField = providerConfig.codeField || "PROVIDERCODE";
  return transBody && transBody[codeField];
}

function getActionUrl(provider, action, defaultUrlField) {
  var urlField = action.urlField || defaultUrlField;
  var actionUrl = provider[urlField];

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

  var mapped = {};
  var keys = Object.keys(mapConfig);
  for (var i = 0; i < keys.length; i += 1) {
    var targetKey = keys[i];
    mapped[targetKey] = getPathValue(source, mapConfig[targetKey]);
  }

  return mapped;
}

function applyResponseMap(responseMap, response, transBody) {
  if (!responseMap) {
    return;
  }

  var responseBody = unwrapActionResponse(response);
  var keys = Object.keys(responseMap);
  for (var i = 0; i < keys.length; i += 1) {
    var transBodyField = keys[i];
    var responsePath = responseMap[transBodyField];
    var value = getPathValue(responseBody, responsePath);

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

  var parts = path.split(".");
  var value = source;
  for (var i = 0; i < parts.length; i += 1) {
    if (value === undefined || value === null) {
      return undefined;
    }

    value = value[parts[i]];
  }

  return value;
}

function validateActionSuccess(response, action) {
  var successRule = action.successRule;
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

  var value = getPathValue(response, successRule.field);
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
    var parsedUrl = url.parse(actionUrl);
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

    var transport = parsedUrl.protocol === "https:" ? https : http;
    var payload = JSON.stringify(requestBody || {});
    var normalizedMethod = String(method || "POST").toUpperCase();
    var headers = {
      "Content-Type": "application/json",
    };

    if (normalizedMethod !== "GET") {
      headers["Content-Length"] = Buffer.byteLength(payload);
    }

    var req = transport.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: normalizedMethod,
        timeout: module.exports.timeoutMs(action),
        headers: headers,
      },
      function (res) {
        var rawBody = "";

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
