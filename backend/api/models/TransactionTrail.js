var DOMAIN = require("../../config/domain").domain;

module.exports = {
  attributes: {
    serviceId: {
      model: "service",
      required: true,
      index: true,
    },
    customerId: {
      model: "customer",
      index: true,
    },
    officerId: {
      model: "officer",
      index: true,
    },
    inputMessage: {
      type: "json",
      required: true,
    },
    outputMessage: {
      type: "json",
      required: true,
    },
    status: {
      type: "string",
      enum: [
        DOMAIN.status.INIT,
        DOMAIN.status.DRAFT,
        DOMAIN.status.PENDING,
        DOMAIN.status.DONE,
        DOMAIN.status.FAILED,
        DOMAIN.status.CANCELLED,
      ],
      defaultsTo: DOMAIN.status.INIT,
      required: true,
      index: true,
    },
    expiredAt: {
      type: "datetime",
      required: true,
      index: true,
    },
    errorCode: {
      type: "string",
    },
    errorMessage: {
      type: "string",
    },
    entries: {
      collection: "pocketentry",
      via: "transRefId",
    },
    transactions: {
      collection: "transaction",
      via: "transRefId",
    },
    createdBy: {
      type: "string",
    },
    updatedBy: {
      type: "string",
    },
  },

  trailTtlMs: function () {
    return MiniWalletConfigService.transactions().trailTtlMs;
  },

  buildMessage: async function (transInput) {
    if (Number(transInput.TRANSTEP) === NeonMessageService.STEP.REQUEST) {
      return this.buildRequestMessage(transInput);
    }

    return this.buildExistingTrailMessage(transInput);
  },

  buildRequestMessage: async function (transInput) {
    const transRefId =
      transInput.body.transRefId || transInput.body.TRANSREFID;

    if (transRefId) {
      const trail = await TransactionTrail.findOne({ id: transRefId });

      if (!trail) {
        throw AppErrorService.create(
          EnvelopeService.CODE.NOT_FOUND,
          "TRANSACTION_TRAIL_NOT_FOUND",
        );
      }

      this.validateTrailOwner(trail, transInput);
      this.validateTrailExpiry(trail);

      if (trail.status !== DOMAIN.status.DRAFT) {
        throw AppErrorService.create(
          EnvelopeService.CODE.INVALID_STATE,
          "TRANSACTION_TRAIL_NOT_EDITABLE",
        );
      }

      const serviceCode = CommonService.cleanUpperString(
        transInput.body.serviceCode,
      );
      if (!serviceCode) {
        throw AppErrorService.create(
          EnvelopeService.CODE.BAD_REQUEST,
          "SERVICE_CODE_REQUIRED",
        );
      }

      const service = await ServiceRuntimeService.loadActiveById(
        trail.serviceId,
      );
      if (
        String(service.id) !== String(trail.serviceId) ||
        CommonService.cleanUpperString(service.code) !== serviceCode
      ) {
        throw AppErrorService.create(
          EnvelopeService.CODE.BAD_REQUEST,
          "TRANSACTION_TRAIL_SERVICE_MISMATCH",
        );
      }

      return {
        transInput: transInput,
        trail: trail,
        isEdit: true,
      };
    }

    const service = await ServiceRuntimeService.loadActiveByCode(
      transInput.body.serviceCode,
    );
    const trail = await TransactionTrail.create({
      serviceId: service.id,
      customerId:
        transInput.userType === DOMAIN.userType.CUSTOMER
          ? transInput.user.id
          : undefined,
      officerId:
        transInput.userType === DOMAIN.userType.OFFICER
          ? transInput.user.id
          : undefined,
      inputMessage: {},
      outputMessage: {},
      status: DOMAIN.status.INIT,
      expiredAt: new Date(Date.now() + this.trailTtlMs()),
      createdBy: String(transInput.user.id),
      updatedBy: String(transInput.user.id),
    });

    return {
      transInput: transInput,
      trail: trail,
      isEdit: false,
    };
  },

  buildExistingTrailMessage: async function (transInput) {
    const transRefId = transInput.body.transRefId || transInput.body.TRANSREFID;
    if (!transRefId) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "TRANSACTION_TRAIL_IDENTIFIER_REQUIRED",
      );
    }

    const trail = await TransactionTrail.findOne({ id: transRefId });

    if (!trail) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "TRANSACTION_TRAIL_NOT_FOUND",
      );
    }

    this.validateTrailOwner(trail, transInput);
    this.validateTrailExpiry(trail);

    const expectedStatus =
      Number(transInput.TRANSTEP) === NeonMessageService.STEP.CONFIRM
        ? DOMAIN.status.DRAFT
        : DOMAIN.status.PENDING;
    if (trail.status !== expectedStatus) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        expectedStatus === DOMAIN.status.DRAFT
          ? "TRANSACTION_TRAIL_NOT_DRAFT"
          : "TRANSACTION_TRAIL_NOT_PENDING",
      );
    }

    return {
      transInput: transInput,
      trail: trail,
      TRANSBODY: trail.outputMessage && trail.outputMessage.TRANSBODY,
    };
  },

  updateDraft: async function (trail, transInput, transBody) {
    const expectedStatus =
      trail.status === DOMAIN.status.INIT
        ? DOMAIN.status.INIT
        : DOMAIN.status.DRAFT;
    const updated = await TransactionTrail.update(
      { id: trail.id, status: expectedStatus },
      {
        inputMessage: this.buildInputMessage(trail.inputMessage, transInput),
        outputMessage: { TRANSBODY: transBody },
        status: DOMAIN.status.DRAFT,
        updatedBy: transBody.USERID || transBody.OFFICERID,
      },
    );

    if (!updated || !updated[0]) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_NOT_EDITABLE",
      );
    }

    return updated[0];
  },

  lockPending: async function (trail, transBody) {
    const updated = await TransactionTrail.update(
      { id: trail.id, status: DOMAIN.status.DRAFT },
      {
        status: DOMAIN.status.PENDING,
        updatedBy: transBody.USERID || transBody.OFFICERID,
      },
    );

    if (!updated || !updated[0]) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_NOT_DRAFT",
      );
    }

    return updated[0];
  },

  updatePendingOutput: async function (trail, transBody) {
    const updated = await TransactionTrail.update(
      { id: trail.id, status: DOMAIN.status.PENDING },
      {
        outputMessage: { TRANSBODY: transBody },
        updatedBy: transBody.USERID || transBody.OFFICERID,
      },
    );

    if (!updated || !updated[0]) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_NOT_PENDING",
      );
    }

    return updated[0];
  },

  markDone: async function (trail, transBody) {
    const updated = await TransactionTrail.update(
      { id: trail.id, status: DOMAIN.status.PENDING },
      {
        outputMessage: { TRANSBODY: transBody },
        status: DOMAIN.status.DONE,
        updatedBy: transBody.USERID || transBody.OFFICERID,
      },
    );

    if (!updated || !updated[0]) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_NOT_PENDING",
      );
    }

    return updated[0];
  },

  buildInputMessage: function (existingInputMessage, transInput) {
    return buildInputMessage(existingInputMessage, transInput);
  },

  validateTrailExpiry: function (trail) {
    if (trail.expiredAt && new Date(trail.expiredAt).getTime() < Date.now()) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_EXPIRED",
      );
    }
  },

  checkStatusTrail: async function (transRefId) {
    const trail = await TransactionTrail.findOne({ id: transRefId });

    if (!trail) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "TRANSACTION_TRAIL_NOT_FOUND",
      );
    }

    if (trail.status !== DOMAIN.status.PENDING) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_NOT_PENDING",
      );
    }

    this.validateTrailExpiry(trail);

    return trail;
  },

  validateTrailOwner: function (trail, transInput) {
    if (
      !transInput ||
      !transInput.user ||
      !transInput.user.id ||
      !transInput.userType
    ) {
      throw AppErrorService.create(
        EnvelopeService.CODE.UNAUTHORIZED,
        "UNAUTHENTICATED",
      );
    }

    const userId = String(transInput.user.id);
    if (
      transInput.userType === DOMAIN.userType.CUSTOMER &&
      String(trail.customerId) === userId
    ) {
      return;
    }

    if (
      transInput.userType === DOMAIN.userType.OFFICER &&
      String(trail.officerId) === userId
    ) {
      return;
    }

    throw AppErrorService.create(
      EnvelopeService.CODE.FORBIDDEN,
      "TRANSACTION_TRAIL_FORBIDDEN",
    );
  },

  markFailed: async function (trail, err, expectedStatus) {
    if (!trail || !trail.id) {
      return;
    }

    const criteria = { id: trail.id };
    if (expectedStatus) {
      criteria.status = expectedStatus;
    }

    await TransactionTrail.update(
      criteria,
      {
        status: DOMAIN.status.FAILED,
        errorCode:
          err && err.messageKey ? err.messageKey : "TRANSACTION_REQUEST_FAILED",
        errorMessage:
          err && err.message ? err.message : "TRANSACTION_REQUEST_FAILED",
      },
    );
  },
};

function buildInputMessage(existingInputMessage, transInput) {
  const body =
    transInput && CommonService.isPlainObject(transInput.body)
      ? transInput.body
      : {};
  const inputMessage = {};
  const keys = Object.keys(body);

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (key === "transRefId" || key === "TRANSREFID") {
      continue;
    }

    inputMessage[key] = body[key];
  }

  return inputMessage;
}
