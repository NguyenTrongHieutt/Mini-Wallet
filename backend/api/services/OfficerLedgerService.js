module.exports = {
  MAX_PAGE_SIZE: 100,

  listEntries: async function (body) {
    body = CommonService.isPlainObject(body) ? body : {};
    const paging = normalizePaging(body, this.MAX_PAGE_SIZE);
    const criteria = await buildEntryCriteria(body);
    const sort = normalizeSort(body);
    const total = await PocketEntry.count(criteria);
    const entries = await PocketEntry.find(criteria)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);

    return {
      items: entries.map(buildEntryListItem),
      pagination: {
        page: paging.page,
        pageSize: paging.pageSize,
        total: total,
        totalPages: Math.ceil(total / paging.pageSize),
      },
      sort: sort,
    };
  },

  entryDetail: async function (body) {
    body = CommonService.isPlainObject(body) ? body : {};
    const entryId = CommonService.cleanString(body.id || body.entryId);
    if (!entryId) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "LEDGER_ENTRY_IDENTIFIER_REQUIRED",
      );
    }

    const entry = await PocketEntry.findOne({ id: entryId });
    if (!entry) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "LEDGER_ENTRY_NOT_FOUND",
      );
    }

    const debitPocket = await Pocket.findOne({ id: entry.debitPocketId });
    const creditPocket = await Pocket.findOne({ id: entry.creditPocketId });
    const currency = await Currency.findOne({ id: entry.currency });

    return {
      entry: {
        id: String(entry.id),
        transRefId: String(entry.transRefId),
        stepOrder: entry.stepOrder,
        debitPocket: buildPocketDetail(entry.debitPocketId, debitPocket),
        creditPocket: buildPocketDetail(entry.creditPocketId, creditPocket),
        amount: entry.amount,
        currency: currency
          ? {
              id: String(currency.id),
              code: currency.code,
              name: currency.name,
              minorUnit: currency.minorUnit,
              status: currency.status,
              createdAt: currency.createdAt,
              updatedAt: currency.updatedAt,
            }
          : { id: String(entry.currency), missing: true },
        status: entry.status,
        createdBy: entry.createdBy,
        updatedBy: entry.updatedBy,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    };
  },
};

async function buildEntryCriteria(body) {
  const criteria = {};
  const transRefId = CommonService.cleanString(body.transRefId);
  const status = CommonService.cleanString(body.status).toLowerCase();
  const pocketId = CommonService.cleanString(body.pocketId);
  if (transRefId) criteria.transRefId = transRefId;
  if (status) criteria.status = status;
  if (pocketId) {
    const direction = CommonService.cleanString(body.direction).toLowerCase();
    if (direction === "debit") criteria.debitPocketId = pocketId;
    else if (direction === "credit") criteria.creditPocketId = pocketId;
    else criteria.or = [{ debitPocketId: pocketId }, { creditPocketId: pocketId }];
  }

  const currencyId = await resolveCurrencyId(body);
  if (currencyId) criteria.currency = currencyId;
  applyDateRange(
    criteria,
    body.dateFrom || body.createdFrom,
    body.dateTo || body.createdTo,
  );
  return criteria;
}

async function resolveCurrencyId(body) {
  const id = CommonService.cleanString(body.currencyId);
  if (id) return id;
  const code = CommonService.cleanUpperString(body.currency);
  if (!code) return "";
  const currency = await Currency.findOne({ code: code });
  return currency ? String(currency.id) : "__CURRENCY_NOT_FOUND__";
}

function buildEntryListItem(entry) {
  return {
    id: String(entry.id),
    transRefId: String(entry.transRefId),
    stepOrder: entry.stepOrder,
    debitPocketId: String(entry.debitPocketId),
    creditPocketId: String(entry.creditPocketId),
    amount: entry.amount,
    currencyId: String(entry.currency),
    status: entry.status,
    createdAt: entry.createdAt,
  };
}

function buildPocketDetail(id, pocket) {
  if (!pocket) return { id: String(id), missing: true };
  return {
    id: String(pocket.id),
    name: pocket.name,
    ownerType: pocket.ownerType,
    ownerId: pocket.ownerId,
    currencyId: String(pocket.currency),
    balance: pocket.balance,
    status: pocket.status,
    lockedBy: pocket.lockedBy || null,
    lockedAt: pocket.lockedAt || null,
    lockExpiredAt: pocket.lockExpiredAt || null,
    createdBy: pocket.createdBy,
    updatedBy: pocket.updatedBy,
    createdAt: pocket.createdAt,
    updatedAt: pocket.updatedAt,
  };
}

function normalizePaging(body, maxPageSize) {
  const rawPage = Number(body.page);
  const rawPageSize = Number(body.pageSize || body.limit);
  const page =
    Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const requested =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.floor(rawPageSize)
      : 20;
  const pageSize = Math.min(requested, maxPageSize);
  return { page: page, pageSize: pageSize, skip: (page - 1) * pageSize };
}

function normalizeSort(body) {
  const allowed = ["createdAt", "updatedAt", "stepOrder", "amount", "status"];
  const requested = CommonService.cleanString(body.sortBy || "createdAt");
  const field = allowed.indexOf(requested) === -1 ? "createdAt" : requested;
  const order = CommonService.cleanUpperString(
    body.sortOrder || body.order || "DESC",
  );
  return field + " " + (order === "ASC" ? "ASC" : "DESC");
}

function applyDateRange(criteria, from, to) {
  const range = {};
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (start && !Number.isNaN(start.getTime())) range[">="] = start;
  if (end && !Number.isNaN(end.getTime())) range["<="] = end;
  if (Object.keys(range).length) criteria.createdAt = range;
}
