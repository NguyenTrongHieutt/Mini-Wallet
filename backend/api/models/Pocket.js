var DOMAIN = require("../../config/domain").domain;

module.exports = {
  attributes: {
    ownerId: {
      type: "string",
      required: true,
      index: true,
    },

    ownerType: {
      type: "string",
      enum: [
        DOMAIN.ownerType.CUSTOMER,
        DOMAIN.ownerType.PROVIDER,
        DOMAIN.ownerType.SYSTEM,
        DOMAIN.ownerType.BANK,
      ],
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
      enum: [DOMAIN.status.ACTIVE, DOMAIN.status.LOCKED],
      defaultsTo: DOMAIN.status.ACTIVE,
      required: true,
    },
    lockedBy: {
      type: "string",
    },
    lockedAt: {
      type: "datetime",
    },
    lockExpiredAt: {
      type: "datetime",
    },
    createdBy: {
      type: "string",
    },
    updatedBy: {
      type: "string",
    },
  },
  lockTtlMs: function () {
    return MiniWalletConfigService.transactions().pocketLockTtlMs;
  },
  getActivePocketByOwner: async function (ownerType, ownerId, currencyCode) {
    const currency = await Currency.loadActive(currencyCode);
    const pocket = await Pocket.findOne({
      ownerType: ownerType,
      ownerId: String(ownerId),
      currency: currency.id,
    });
    if (!pocket || pocket.status !== DOMAIN.status.ACTIVE) {
      return null;
    }
    return pocket;
  },

  validateStateAndLockPocket: async function (senderPocketId, transRefId) {
    const pocket = await Pocket.findOne({ id: senderPocketId });

    if (!pocket) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "SENDER_POCKET_NOT_FOUND",
      );
    }

    if (pocket.status === DOMAIN.status.LOCKED && isLockExpired(pocket)) {
      await Pocket.releaseLockedPocket(pocket, pocket.lockedBy);
      pocket.status = DOMAIN.status.ACTIVE;
    } else if (
      pocket.status === DOMAIN.status.LOCKED &&
      String(pocket.lockedBy) === String(transRefId)
    ) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "TRANSACTION_ALREADY_PROCESSING",
        { pocketId: senderPocketId, transRefId: String(transRefId) },
      );
    }

    if (pocket.status !== DOMAIN.status.ACTIVE) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "SENDER_POCKET_NOT_ACTIVE",
        { pocketId: senderPocketId, status: pocket.status },
      );
    }

    const now = new Date();
    const updated = await Pocket.update(
      { id: senderPocketId, status: DOMAIN.status.ACTIVE },
      {
        status: DOMAIN.status.LOCKED,
        lockedBy: String(transRefId),
        lockedAt: now,
        lockExpiredAt: new Date(now.getTime() + this.lockTtlMs()),
        updatedBy: "engine",
      },
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

  releaseLockedPocket: async function (pocket, transRefId) {
    if (!pocket || !pocket.id) {
      return null;
    }

    const criteria = { id: pocket.id, status: DOMAIN.status.LOCKED };
    if (transRefId) {
      criteria.lockedBy = String(transRefId);
    }

    const updated = await Pocket.update(criteria, {
      status: DOMAIN.status.ACTIVE,
      lockedBy: null,
      lockedAt: null,
      lockExpiredAt: null,
      updatedBy: "engine",
    });

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

function isLockExpired(pocket) {
  return (
    pocket.lockExpiredAt &&
    new Date(pocket.lockExpiredAt).getTime() <= Date.now()
  );
}
