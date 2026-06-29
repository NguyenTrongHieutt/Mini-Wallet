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
      transBody[field.name] = await this.resolveField(
        field,
        transInput,
        transBody,
      );
    }

    transBody.TRANSREFID = String(trail.id);
    transBody.SERVICEID = String(service.id);
    transBody.SERVICECODE = service.code;

    return transBody;
  },

  resolveField: async function (field, transInput, transBody) {
    if (field.rule === "fixed") {
      return field.value;
    }

    if (field.rule === "mapping") {
      return this.resolveMapping(field, transInput);
    }

    if (field.rule === "query") {
      return this.resolveQuery(field, transBody);
    }

    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "UNSUPPORTED_FIELD_BUILDER_RULE",
      { field: field.name, rule: field.rule },
    );
  },

  resolveMapping: function (field, transInput) {
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
  },

  resolveQuery: async function (field, transBody) {
    const params = (field.params || []).map(function (name) {
      return Service.resolveQueryParam(name, transBody);
    });
    const queryHandler = this.resolveQueryHandler(field.query);

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
  },

  resolveQueryParam: function (param, transBody) {
    if (param && typeof param === "object") {
      if (param.source === "constant") {
        return param.value;
      }

      if (param.source === "field") {
        return transBody[param.name];
      }
    }

    return transBody[param];
  },

  resolveQueryHandler: function (queryPath) {
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
  },

  runRequestAction: async function (service) {
    if (
      !service.actions ||
      !service.actions.request ||
      service.actions.request.enabled !== true
    ) {
      return null;
    }

    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "UNSUPPORTED_VALIDATION_RULE",
      { action: "request" },
    );
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

  sortByOrder: function (items) {
    return (items || []).sort(function (a, b) {
      return Number(a.order || 0) - Number(b.order || 0);
    });
  },
};
