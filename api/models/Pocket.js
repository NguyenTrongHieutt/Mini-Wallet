module.exports = {
  attributes: {
    ownerId: {
      type: "string",
      required: true,
      index: true,
    },

    ownerType: {
      type: "string",
      enum: ["customer", "provider", "system", "bank"],
      required: true,
      index: true,
    },
    currency: {
      model: "currency",
      required: true,
    },
    balance: {
      type: "integer",
      required: true,
      defaultsTo: 0,
    },
    checksum: {
      type: "string",
      required: true,
    },
    name: {
      type: "string",
      required: true,
    },
    status: {
      type: "string",
      enum: ["active", "locked"],
      defaultsTo: "active",
      required: true,
    },
    createdBy: {
      type: "string",
    },
    updatedBy: {
      type: "string",
    },
  },

  getActivePocketByOwner: async function (ownerType, ownerId, currencyCode) {
    const currency = await Currency.loadActive(currencyCode);
    return Pocket.findOne({
      ownerType: ownerType,
      ownerId: String(ownerId),
      currency: currency.id,
      status: "active",
    });
  },

  validateStateAndLockPocket: async function (senderPocketId) {
    const pocket = await Pocket.findOne({ id: senderPocketId });

    if (!pocket) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "SENDER_POCKET_NOT_FOUND",
      );
    }

    if (pocket.status !== "active") {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "SENDER_POCKET_NOT_ACTIVE",
        { pocketId: senderPocketId, status: pocket.status },
      );
    }

    const updated = await Pocket.update(
      { id: senderPocketId, status: "active" },
      { status: "locked", updatedBy: "engine" },
    );

    if (!updated || !updated[0]) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "SENDER_POCKET_LOCK_FAILED",
        { pocketId: senderPocketId },
      );
    }

    return updated[0];
  },

  releaseLockedPocket: async function (pocket) {
    if (!pocket || !pocket.id) {
      return null;
    }

    const updated = await Pocket.update(
      { id: pocket.id, status: "locked" },
      { status: "active", updatedBy: "engine" },
    );

    return updated && updated[0];
  },

  validateChecksum: function (pocket, errorCode) {
    if (!pocket) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        errorCode || "POCKET_NOT_FOUND",
      );
    }

    const expected = CryptoService.checksumPocket({
      ownerType: pocket.ownerType,
      ownerId: pocket.ownerId,
      currency: pocket.currency,
      balance: pocket.balance,
    });

    if (pocket.checksum !== expected) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        errorCode || "POCKET_CHECKSUM_INVALID",
        { pocketId: pocket.id || pocket._id },
      );
    }
  },
};
