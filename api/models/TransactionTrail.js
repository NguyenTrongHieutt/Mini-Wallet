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
      enum: ["init", "pending", "done", "failed", "cancelled"],
      defaultsTo: "init",
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

  TRAIL_TTL_MS: 15 * 60 * 1000,

  buildMessage: async function (transInput) {
    if (Number(transInput.TRANSTEP) === NeonMessageService.STEP.REQUEST) {
      return this.buildRequestMessage(transInput);
    }

    return this.buildExistingTrailMessage(transInput);
  },

  buildRequestMessage: async function (transInput) {
    const service = await Service.loadActiveByCode(transInput.body.serviceCode);
    const trail = await TransactionTrail.create({
      serviceId: service.id,
      customerId: transInput.userType === "customer" ? transInput.user.id : undefined,
      officerId: transInput.userType === "officer" ? transInput.user.id : undefined,
      inputMessage: {
        TRANSTEP: transInput.TRANSTEP,
        body: transInput.body,
        userId: String(transInput.user.id),
        userType: transInput.userType,
      },
      outputMessage: {},
      status: "init",
      expiredAt: new Date(Date.now() + this.TRAIL_TTL_MS),
      createdBy: String(transInput.user.id),
      updatedBy: String(transInput.user.id),
    });

    return {
      transInput: transInput,
      trail: trail,
    };
  },

  buildExistingTrailMessage: async function (transInput) {
    const transRefId = transInput.body.transRefId || transInput.body.TRANSREFID;
    const trail = await TransactionTrail.findOne({ id: transRefId, status: "pending" });

    if (!trail) {
      throw AppErrorService.create(EnvelopeService.CODE.NOT_FOUND, "TRANSACTION_TRAIL_NOT_FOUND");
    }

    if (trail.expiredAt && new Date(trail.expiredAt).getTime() < Date.now()) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_EXPIRED"
      );
    }

    this.validateTrailOwner(trail, transInput);

    return {
      transInput: transInput,
      trail: trail,
      TRANSBODY: trail.outputMessage && trail.outputMessage.TRANSBODY,
    };
  },

  updatePending: async function (trail, transBody) {
    const updated = await TransactionTrail.update(
      { id: trail.id },
      {
        outputMessage: { TRANSBODY: transBody },
        status: "pending",
        updatedBy: transBody.USERID || transBody.OFFICERID,
      }
    );

    return updated[0];
  },

  markDone: async function (trail, transBody) {
    const updated = await TransactionTrail.update(
      { id: trail.id, status: "pending" },
      {
        outputMessage: { TRANSBODY: transBody },
        status: "done",
        updatedBy: transBody.USERID || transBody.OFFICERID,
      }
    );

    if (!updated || !updated[0]) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_NOT_PENDING"
      );
    }

    return updated[0];
  },

  checkStatusTrail: async function (transRefId) {
    const trail = await TransactionTrail.findOne({ id: transRefId });

    if (!trail) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "TRANSACTION_TRAIL_NOT_FOUND"
      );
    }

    if (trail.status !== "pending") {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_NOT_PENDING"
      );
    }

    if (trail.expiredAt && new Date(trail.expiredAt).getTime() < Date.now()) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_TRAIL_EXPIRED"
      );
    }

    return trail;
  },

  validateTrailOwner: function (trail, transInput) {
    if (!transInput || !transInput.user || !transInput.user.id || !transInput.userType) {
      throw AppErrorService.create(EnvelopeService.CODE.UNAUTHORIZED, "UNAUTHENTICATED");
    }

    const userId = String(transInput.user.id);
    if (transInput.userType === "customer" && String(trail.customerId) === userId) {
      return;
    }

    if (transInput.userType === "officer" && String(trail.officerId) === userId) {
      return;
    }

    throw AppErrorService.create(
      EnvelopeService.CODE.FORBIDDEN,
      "TRANSACTION_TRAIL_FORBIDDEN"
    );
  },

  markFailed: async function (trail, err) {
    if (!trail || !trail.id) {
      return;
    }

    await TransactionTrail.update(
      { id: trail.id },
      {
        status: "failed",
        errorCode: err && err.messageKey ? err.messageKey : "TRANSACTION_REQUEST_FAILED",
        errorMessage: err && err.message ? err.message : "TRANSACTION_REQUEST_FAILED",
      }
    );
  },
};
