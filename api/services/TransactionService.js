module.exports = {
  engineRequestTransaction: async function (body, info) {
    const transInput = normalizeInput(body, info);
    transInput.TRANSTEP = NeonMessageService.STEP.REQUEST;

    return NeonMessageService.routeProcess(transInput);
  },

  engineConfirmTransaction: async function (body, info) {
    const transInput = normalizeInput(body, info);
    transInput.TRANSTEP = NeonMessageService.STEP.CONFIRM;

    return NeonMessageService.routeProcess(transInput);
  },

  engineVerifyTransaction: async function (body, info) {
    const transInput = normalizeInput(body, info);
    transInput.TRANSTEP = NeonMessageService.STEP.VERIFY;

    return NeonMessageService.routeProcess(transInput);
  },
};

function normalizeInput(body, info) {
  body = normalizeBody(body);
  info = info || {};

  const serviceCode = CommonService.cleanUpperString(
    body.serviceCode || body.SERVICECODE || body.service_code
  );
  const currency = CommonService.cleanUpperString(body.currency || body.CURRENCY, "VND");

  body.serviceCode = serviceCode;
  body.currency = currency;

  return {
    body: body,
    user: info.user,
    userType: info.userType,
  };
}

function normalizeBody(body) {
  if (!CommonService.isPlainObject(body)) {
    return {};
  }

  const normalized = {};
  const keys = Object.keys(body);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    normalized[key] = normalizeValue(body[key]);
  }

  return normalized;
}

function normalizeValue(value) {
  if (typeof value === "string") {
    return CommonService.cleanString(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (CommonService.isPlainObject(value)) {
    const normalized = {};
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      normalized[key] = normalizeValue(value[key]);
    }

    return normalized;
  }

  return value;
}
