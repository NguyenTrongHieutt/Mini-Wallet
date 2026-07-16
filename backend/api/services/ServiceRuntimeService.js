var DOMAIN = require("../../config/domain").domain;

module.exports = {
  loadActiveByCode: async function (serviceCode) {
    const service = await Service.findOne({ code: serviceCode });

    if (!service) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "SERVICE_NOT_FOUND",
      );
    }

    if (service.status !== DOMAIN.status.ACTIVE) {
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

    if (service.status !== DOMAIN.status.ACTIVE) {
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
      USERTYPE: transInput.userType,
    };

    if (transInput.user && transInput.user.id) {
      if (transInput.userType === DOMAIN.userType.CUSTOMER) {
        transBody.USERID = String(transInput.user.id);
      } else if (transInput.userType === DOMAIN.userType.OFFICER) {
        transBody.OFFICERID = String(transInput.user.id);
      }

      if (transInput.user.role) {
        transBody.USERROLE = transInput.user.role;
      }
    }

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
      currency:
        transBody.CURRENCY ||
        MiniWalletConfigService.wallet().defaultCurrency,
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
      authMethod: auth.method || DOMAIN.authMethod.NONE,
      status: trail.status,
      expiredAt: trail.expiredAt,
    };
  },

  runRequestAction: async function (service, transBody) {
    return ProviderActionGatewayService.run(
      service,
      transBody,
      DOMAIN.action.REQUEST,
      "requestUrl",
    );
  },

  runConfirmAction: async function (service, transBody) {
    return ProviderActionGatewayService.run(
      service,
      transBody,
      DOMAIN.action.CONFIRM,
      "confirmUrl",
    );
  },

  runVerifyAction: async function (service, transBody) {
    return ProviderActionGatewayService.run(
      service,
      transBody,
      DOMAIN.action.VERIFY,
      "verifyUrl",
    );
  },

  verifyAuth: function (service, transInput) {
    const auth = service.auth || {};
    const method = auth.method || DOMAIN.authMethod.NONE;

    if (method === DOMAIN.authMethod.NONE) {
      return;
    }

    if (method === DOMAIN.authMethod.PIN) {
      const pin = CommonService.cleanString(
        transInput.body && transInput.body.pin,
      );
      const user = transInput.user || {};

      if (
        transInput.userType !== DOMAIN.userType.CUSTOMER ||
        !CryptoService.verifySecret(pin, user.pinHash)
      ) {
        throw AppErrorService.create(
          EnvelopeService.CODE.UNAUTHORIZED,
          "INVALID_PIN",
        );
      }

      return;
    }

    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "UNSUPPORTED_AUTH_METHOD",
      { method: method },
    );
  },

  buildReceipt: function (receipt, service) {
    return {
      transRefId: String(receipt.trail.id),
      transaction: {
        id: String(receipt.transaction.id),
        code: receipt.transaction.code,
        status: receipt.transaction.status,
      },
      service: {
        id: String(service.id),
        code: service.code,
        name: service.name,
      },
      amount: receipt.transaction.amount,
      fee: receipt.transaction.fee,
      totalAmount: receipt.transaction.totalAmount,
      message: receipt.transaction.message,
      currency: receipt.currency.code,
      status: receipt.trail.status,
    };
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
  if (!FieldBuilderRegistryService.supports(field.query)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "UNSUPPORTED_FIELD_BUILDER_QUERY",
      { field: field.name, query: field.query },
    );
  }
  const result = await FieldBuilderRegistryService.execute(
    field.query,
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
