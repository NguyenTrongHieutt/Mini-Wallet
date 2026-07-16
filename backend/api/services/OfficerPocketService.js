module.exports = {
  MAX_PAGE_SIZE: 100,
  OFFICER_LOCK_PREFIX: "officer:",

  create: async function (body, officer) {
    body = CommonService.isPlainObject(body) ? body : {};
    const values = normalizeCreateInput(body);
    const currency = await Currency.loadActive(values.currencyCode);
    const existing = await Pocket.findOne({
      ownerType: values.ownerType,
      ownerId: values.ownerId,
      currency: currency.id,
    });

    if (existing) {
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "POCKET_ALREADY_EXISTS",
        { pocketId: String(existing.id) },
      );
    }

    const pocketSeed = {
      ownerType: values.ownerType,
      ownerId: values.ownerId,
      currency: currency.id,
      balance: values.balance,
      name: values.name,
      status: "active",
      createdBy: String(officer.id),
      updatedBy: String(officer.id),
    };
    pocketSeed.checksum = CryptoService.checksumPocket(pocketSeed);

    let pocket;
    try {
      pocket = await Pocket.create(pocketSeed);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw AppErrorService.create(
          EnvelopeService.CODE.CONFLICT,
          "POCKET_ALREADY_EXISTS",
        );
      }
      throw err;
    }

    return { pocket: serializePocket(pocket, currency) };
  },

  list: async function (body) {
    body = CommonService.isPlainObject(body) ? body : {};
    const paging = normalizePaging(body);
    const criteria = await buildCriteria(body);
    const sort = normalizeSort(body);
    const total = await Pocket.count(criteria);
    const pockets = await Pocket.find(criteria)
      .populate("currency")
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);

    return {
      items: pockets.map(function (pocket) {
        return serializePocket(pocket, pocket.currency);
      }),
      pagination: {
        page: paging.page,
        pageSize: paging.pageSize,
        total: total,
        totalPages: Math.ceil(total / paging.pageSize),
      },
      filters: {
        q: CommonService.cleanString(body.q || body.search || body.keyword),
        ownerType:
          CommonService.cleanString(body.ownerType).toLowerCase() || undefined,
        status:
          CommonService.cleanString(body.status).toLowerCase() || undefined,
        currency:
          CommonService.cleanString(body.currency).toUpperCase() || undefined,
      },
      sort: sort,
    };
  },

  detail: async function (body) {
    const pocket = await findPocket(body, true);
    return { pocket: serializePocket(pocket, pocket.currency) };
  },

  changeStatus: async function (body, officer, targetStatus) {
    const pocket = await findPocket(body, false);
    const officerLock = module.exports.OFFICER_LOCK_PREFIX + String(officer.id);

    if (targetStatus === "locked") {
      if (pocket.status === "locked") {
        ensureOfficerLock(pocket);
        return { pocket: await populatePocketCurrency(pocket), changed: false };
      }

      const updated = await Pocket.update(
        { id: pocket.id, status: "active" },
        {
          status: "locked",
          lockedBy: officerLock,
          lockedAt: new Date(),
          lockExpiredAt: null,
          updatedBy: String(officer.id),
        },
      );
      return finalizeStatusChange(
        pocket.id,
        updated,
        targetStatus,
        "POCKET_LOCK_FAILED",
      );
    }

    if (pocket.status === "active") {
      return { pocket: await populatePocketCurrency(pocket), changed: false };
    }

    ensureOfficerLock(pocket);
    const updated = await Pocket.update(
      { id: pocket.id, status: "locked", lockedBy: pocket.lockedBy },
      {
        status: "active",
        lockedBy: null,
        lockedAt: null,
        lockExpiredAt: null,
        updatedBy: String(officer.id),
      },
    );
    return finalizeStatusChange(
      pocket.id,
      updated,
      targetStatus,
      "POCKET_UNLOCK_FAILED",
    );
  },
};

function normalizeCreateInput(body) {
  const ownerType = CommonService.cleanString(body.ownerType).toLowerCase();
  const ownerId = CommonService.cleanString(body.ownerId);
  const name = CommonService.cleanString(body.name);
  const currencyCode = CommonService.cleanUpperString(body.currency, "VND");
  const balance =
    body.balance === undefined || body.balance === null ? 0 : body.balance;

  if (!ownerType) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_OWNER_TYPE_REQUIRED",
    );
  }
  if (["system", "bank"].indexOf(ownerType) === -1) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_OWNER_TYPE_INVALID",
    );
  }
  if (!ownerId) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_OWNER_ID_REQUIRED",
    );
  }
  if (ownerId.length > 100) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_OWNER_ID_LENGTH_INVALID",
    );
  }
  if (!name) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_NAME_REQUIRED",
    );
  }
  if (name.length < 2 || name.length > 100) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_NAME_LENGTH_INVALID",
    );
  }
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "CURRENCY_FORMAT_INVALID",
    );
  }
  if (!Number.isSafeInteger(balance) || balance < 0) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_BALANCE_INVALID",
    );
  }

  return {
    ownerType: ownerType,
    ownerId: ownerId,
    name: name,
    currencyCode: currencyCode,
    balance: balance,
  };
}

function normalizePaging(body) {
  const requestedPage = Number(body.page || 1);
  const requestedPageSize = Number(body.pageSize || body.limit || 20);
  const page = Number.isFinite(requestedPage)
    ? Math.max(Math.floor(requestedPage), 1)
    : 1;
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(
        Math.max(Math.floor(requestedPageSize), 1),
        module.exports.MAX_PAGE_SIZE,
      )
    : 20;

  return { page: page, pageSize: pageSize, skip: (page - 1) * pageSize };
}

async function buildCriteria(body) {
  const criteria = {};
  const ownerType = CommonService.cleanString(body.ownerType).toLowerCase();
  const status = CommonService.cleanString(body.status).toLowerCase();
  const currencyCode = CommonService.cleanString(body.currency).toUpperCase();
  const search = CommonService.cleanString(
    body.q || body.search || body.keyword,
  );

  if (
    ownerType &&
    ["customer", "provider", "system", "bank"].indexOf(ownerType) === -1
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_FILTER_OWNER_TYPE_INVALID",
    );
  }
  if (status && ["active", "locked"].indexOf(status) === -1) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_STATUS_INVALID",
    );
  }
  if (currencyCode && !/^[A-Z]{3}$/.test(currencyCode)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "CURRENCY_FORMAT_INVALID",
    );
  }

  if (ownerType) criteria.ownerType = ownerType;
  if (status) criteria.status = status;
  if (search) {
    criteria.or = [
      { name: { contains: search } },
      { ownerId: { contains: search } },
    ];
  }
  if (currencyCode) {
    const currency = await Currency.findOne({ code: currencyCode });
    if (!currency) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "CURRENCY_NOT_FOUND",
      );
    }
    criteria.currency = currency.id;
  }
  return criteria;
}

function normalizeSort(body) {
  const allowed = [
    "name",
    "ownerType",
    "ownerId",
    "balance",
    "status",
    "createdAt",
    "updatedAt",
  ];
  const requested = CommonService.cleanString(body.sortBy || "createdAt");
  const field = allowed.indexOf(requested) === -1 ? "createdAt" : requested;
  const direction = CommonService.cleanString(
    body.sortOrder || body.order || "DESC",
  ).toUpperCase();
  return field + " " + (direction === "ASC" ? "ASC" : "DESC");
}

async function findPocket(body, populateCurrency) {
  body = CommonService.isPlainObject(body) ? body : {};
  const pocketId = CommonService.cleanString(body.pocketId || body.id);
  if (!pocketId) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_IDENTIFIER_REQUIRED",
    );
  }

  let query = Pocket.findOne({ id: pocketId });
  if (populateCurrency) query = query.populate("currency");
  const pocket = await query;
  if (!pocket) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "POCKET_NOT_FOUND",
    );
  }
  return pocket;
}

function ensureOfficerLock(pocket) {
  const lockedBy = CommonService.cleanString(pocket.lockedBy);
  if (
    lockedBy &&
    lockedBy.indexOf(module.exports.OFFICER_LOCK_PREFIX) === 0 &&
    !pocket.lockExpiredAt
  ) {
    return;
  }
  throw AppErrorService.create(
    EnvelopeService.CODE.INVALID_STATE,
    "POCKET_TRANSACTION_LOCKED",
    { pocketId: String(pocket.id) },
  );
}

async function finalizeStatusChange(
  pocketId,
  updated,
  targetStatus,
  errorMessage,
) {
  if (updated && updated[0]) {
    return { pocket: await populatePocketCurrency(updated[0]), changed: true };
  }

  const current = await Pocket.findOne({ id: pocketId });
  if (current && current.status === targetStatus) {
    if (targetStatus === "locked") ensureOfficerLock(current);
    return { pocket: await populatePocketCurrency(current), changed: false };
  }
  throw AppErrorService.create(
    EnvelopeService.CODE.INVALID_STATE,
    errorMessage,
  );
}

async function populatePocketCurrency(pocket) {
  const populated = await Pocket.findOne({ id: pocket.id }).populate("currency");
  return serializePocket(populated, populated.currency);
}

function serializePocket(pocket, currency) {
  return {
    id: String(pocket.id),
    ownerType: pocket.ownerType,
    ownerId: pocket.ownerId,
    name: pocket.name,
    balance: pocket.balance,
    currency: currency && currency.code
      ? {
          code: currency.code,
          name: currency.name,
          minorUnit: currency.minorUnit,
        }
      : currency,
    status: pocket.status,
    lock: pocket.status === "locked"
      ? {
          type:
            CommonService.cleanString(pocket.lockedBy).indexOf(
              module.exports.OFFICER_LOCK_PREFIX,
            ) === 0
              ? "officer"
              : "transaction",
          lockedAt: pocket.lockedAt,
          lockExpiredAt: pocket.lockExpiredAt,
        }
      : null,
    createdBy: pocket.createdBy,
    updatedBy: pocket.updatedBy,
    createdAt: pocket.createdAt,
    updatedAt: pocket.updatedAt,
  };
}

function isDuplicateKeyError(err) {
  if (!err) return false;
  if (Number(err.code) === 11000 || Number(err.code) === 11001) return true;
  if (/E11000|duplicate key/i.test(err.message || "")) return true;

  const nested = err.originalError || err.raw || err.cause;
  return nested && nested !== err ? isDuplicateKeyError(nested) : false;
}
