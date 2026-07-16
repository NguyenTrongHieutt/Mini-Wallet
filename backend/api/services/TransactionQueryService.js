module.exports = {
  MAX_PAGE_SIZE: 100,

  listCustomerTransactions: async function (customer, body) {
    const paging = normalizePaging(body);
    const criteria = await buildCustomerCriteria(customer, body);
    const sort = normalizeSort(body);

    const total = await Transaction.count(criteria);
    const transactions = await Transaction.find(criteria)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);

    const items = [];
    for (let i = 0; i < transactions.length; i += 1) {
      items.push(buildTransactionListItem(transactions[i], customer));
    }

    return {
      items: items,
      pagination: {
        page: paging.page,
        pageSize: paging.pageSize,
        total: total,
        totalPages: Math.ceil(total / paging.pageSize),
      },
      filters: buildFilterEcho(body),
      sort: sort,
    };
  },

  getCustomerTransactionDetail: async function (customer, body) {
    const transaction = await findCustomerTransaction(customer, body);
    if (!transaction) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "TRANSACTION_NOT_FOUND",
      );
    }

    const transactionDetail = await buildTransactionSummary(
      transaction,
      customer,
    );
    return {
      transaction: transactionDetail,
    };
  },

  listOfficerTransactions: async function (body) {
    body = CommonService.isPlainObject(body) ? body : {};
    const paging = normalizePaging(body);
    const criteria = await buildOfficerCriteria(body);
    const sort = normalizeSort(body);
    const total = await Transaction.count(criteria);
    const transactions = await Transaction.find(criteria)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);

    return {
      items: transactions.map(buildOfficerTransactionListItem),
      pagination: {
        page: paging.page,
        pageSize: paging.pageSize,
        total: total,
        totalPages: Math.ceil(total / paging.pageSize),
      },
      filters: buildFilterEcho(body),
      sort: sort,
    };
  },

  getOfficerTransactionDetail: async function (body) {
    body = CommonService.isPlainObject(body) ? body : {};
    const criteria = buildTransactionIdentifier(body);
    const transaction = await Transaction.findOne(criteria);
    if (!transaction) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "TRANSACTION_NOT_FOUND",
      );
    }

    const service = await Service.findOne({ id: transaction.serviceId });
    const currency = await Currency.findOne({ id: transaction.currency });
    const parties = await loadTransactionParties(transaction);
    return {
      transaction: buildOfficerTransactionDetail(transaction, service, currency, parties),
    };
  },
};

async function buildOfficerCriteria(body) {
  const criteria = {};
  const status = CommonService.cleanString(body.status).toLowerCase();
  if (status) criteria.status = status;
  const senderCustomer = CommonService.cleanString(body.senderCustomerId);
  const receiverCustomer = CommonService.cleanString(body.receiverCustomerId);
  const receiverProvider = CommonService.cleanString(body.receiverProviderId);
  const transRefId = CommonService.cleanString(body.transRefId);
  if (senderCustomer) criteria.senderCustomer = senderCustomer;
  if (receiverCustomer) criteria.receiverCustomer = receiverCustomer;
  if (receiverProvider) criteria.receiverProvider = receiverProvider;
  if (transRefId) criteria.transRefId = transRefId;

  const serviceId = await resolveServiceId(body);
  if (serviceId) criteria.serviceId = serviceId;
  applyNumberRange(criteria, "amount", body.amountFrom, body.amountTo);
  applyNumberRange(criteria, "totalAmount", body.totalAmountFrom, body.totalAmountTo);
  applyDateRange(criteria, body.dateFrom || body.createdFrom, body.dateTo || body.createdTo);

  const search = CommonService.cleanString(body.q || body.search || body.keyword);
  if (search) {
    criteria.or = [
      { code: { contains: search } },
      { message: { contains: search } },
    ];
  }
  return criteria;
}

function buildTransactionIdentifier(body) {
  const id = CommonService.cleanString(body.id || body.transactionId);
  const code = CommonService.cleanString(body.code);
  const transRefId = CommonService.cleanString(body.transRefId || body.TRANSREFID);
  if (id) return { id: id };
  if (code) return { code: code };
  if (transRefId) return { transRefId: transRefId };
  throw AppErrorService.create(
    EnvelopeService.CODE.BAD_REQUEST,
    "TRANSACTION_IDENTIFIER_REQUIRED",
  );
}

function buildOfficerTransactionListItem(transaction) {
  return {
    id: String(transaction.id),
    code: transaction.code,
    transRefId: String(transaction.transRefId),
    serviceId: String(transaction.serviceId),
    senderCustomerId: transaction.senderCustomer ? String(transaction.senderCustomer) : null,
    receiverCustomerId: transaction.receiverCustomer ? String(transaction.receiverCustomer) : null,
    receiverProviderId: transaction.receiverProvider ? String(transaction.receiverProvider) : null,
    amount: transaction.amount,
    fee: transaction.fee,
    totalAmount: transaction.totalAmount,
    currencyId: String(transaction.currency),
    message: transaction.message,
    status: transaction.status,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

function buildOfficerTransactionDetail(transaction, service, currency, parties) {
  const item = buildOfficerTransactionListItem(transaction);
  item.service = service
    ? { id: String(service.id), code: service.code, name: service.name }
    : { id: String(transaction.serviceId) };
  item.currency = currency
    ? { id: String(currency.id), code: currency.code, name: currency.name, minorUnit: currency.minorUnit }
    : { id: String(transaction.currency) };
  item.sender = buildCustomerParty(parties.senderCustomer);
  item.receiver = buildReceiverParty(parties);
  item.createdBy = transaction.createdBy;
  item.updatedBy = transaction.updatedBy;
  delete item.serviceId;
  delete item.currencyId;
  return item;
}

async function buildCustomerCriteria(customer, body) {
  const criteria = {};
  const type = CommonService.cleanString(
    body.type || body.direction,
  ).toLowerCase();
  const customerId = String(customer.id);

  if (type === "sent" || type === "debit") {
    criteria.senderCustomer = customerId;
  } else if (type === "received" || type === "credit") {
    criteria.receiverCustomer = customerId;
  } else {
    criteria.or = [
      { senderCustomer: customerId },
      { receiverCustomer: customerId },
    ];
  }

  const status = CommonService.cleanString(body.status);
  if (status) {
    criteria.status = status;
  }

  const serviceId = await resolveServiceId(body);
  if (serviceId) {
    criteria.serviceId = serviceId;
  }

  applyNumberRange(criteria, "amount", body.amountFrom, body.amountTo);
  applyNumberRange(
    criteria,
    "totalAmount",
    body.totalAmountFrom,
    body.totalAmountTo,
  );
  applyDateRange(
    criteria,
    body.dateFrom || body.createdFrom,
    body.dateTo || body.createdTo,
  );

  const search = CommonService.cleanString(
    body.q || body.search || body.keyword,
  );
  if (search) {
    const searchCriteria = [
      { code: { contains: search } },
      { message: { contains: search } },
    ];

    if (criteria.or) {
      criteria.and = [{ or: criteria.or }, { or: searchCriteria }];
      delete criteria.or;
    } else {
      criteria.or = searchCriteria;
    }
  }

  return criteria;
}

async function resolveServiceId(body) {
  const serviceId = CommonService.cleanString(body.serviceId);
  if (serviceId) {
    return serviceId;
  }

  const serviceCode = CommonService.cleanUpperString(body.serviceCode);
  if (!serviceCode) {
    return "";
  }

  const service = await Service.findOne({ code: serviceCode });
  return service ? String(service.id) : "__SERVICE_NOT_FOUND__";
}

function normalizePaging(body) {
  const rawPage = Number(body.page);
  const rawPageSize = Number(body.pageSize || body.limit);
  const page = Number.isFinite(rawPage) && rawPage > 0
    ? Math.floor(rawPage)
    : 1;
  const requestedPageSize = Number.isFinite(rawPageSize) && rawPageSize > 0
    ? Math.floor(rawPageSize)
    : 20;
  const pageSize = Math.min(requestedPageSize, module.exports.MAX_PAGE_SIZE);

  return {
    page: page,
    pageSize: pageSize,
    skip: (page - 1) * pageSize,
  };
}

function normalizeSort(body) {
  const allowed = ["createdAt", "amount", "totalAmount", "status", "code"];
  const sortBy = CommonService.cleanString(body.sortBy || "createdAt");
  const field = allowed.indexOf(sortBy) === -1 ? "createdAt" : sortBy;
  const direction = CommonService.cleanString(
    body.sortOrder || body.order || "DESC",
  ).toUpperCase();

  return field + " " + (direction === "ASC" ? "ASC" : "DESC");
}

function applyNumberRange(criteria, field, from, to) {
  const range = {};
  const min = Number(from);
  const max = Number(to);

  if (Number.isFinite(min)) {
    range[">="] = min;
  }
  if (Number.isFinite(max)) {
    range["<="] = max;
  }
  if (Object.keys(range).length) {
    criteria[field] = range;
  }
}

function applyDateRange(criteria, from, to) {
  const range = {};
  const start = parseDate(from);
  const end = parseDate(to);

  if (start) {
    range[">="] = start;
  }
  if (end) {
    range["<="] = end;
  }
  if (Object.keys(range).length) {
    criteria.createdAt = range;
  }
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildTransactionListItem(transaction, customer) {
  const customerId = String(customer.id);

  return {
    id: String(transaction.id),
    code: transaction.code,
    transRefId: String(transaction.transRefId),
    direction:
      String(transaction.senderCustomer) === customerId ? "sent" : "received",
    amount: transaction.amount,
    fee: transaction.fee,
    totalAmount: transaction.totalAmount,
    currency: String(transaction.currency),
    message: transaction.message,
    status: transaction.status,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

async function buildTransactionSummary(transaction, customer) {
  const service = await Service.findOne({ id: transaction.serviceId });
  const currency = await Currency.findOne({ id: transaction.currency });
  const parties = await loadTransactionParties(transaction);

  return buildTransactionBase(
    transaction,
    customer,
    service,
    currency,
    parties,
  );
}

async function loadTransactionParties(transaction) {
  const senderCustomer = transaction.senderCustomer
    ? await Customer.findOne({ id: transaction.senderCustomer })
    : null;
  const receiverCustomer = transaction.receiverCustomer
    ? await Customer.findOne({ id: transaction.receiverCustomer })
    : null;
  const receiverProvider = transaction.receiverProvider
    ? await Provider.findOne({ id: transaction.receiverProvider })
    : null;

  return {
    senderCustomer: senderCustomer,
    receiverCustomer: receiverCustomer,
    receiverProvider: receiverProvider,
  };
}

function buildTransactionBase(
  transaction,
  customer,
  service,
  currency,
  parties,
) {
  const customerId = String(customer.id);
  parties = parties || {};

  return {
    id: String(transaction.id),
    code: transaction.code,
    transRefId: String(transaction.transRefId),
    direction:
      String(transaction.senderCustomer) === customerId ? "sent" : "received",
    service: {
      code: service.code,
      name: service.name,
    },
    sender: buildCustomerParty(parties.senderCustomer),
    receiver: buildReceiverParty(parties),
    amount: transaction.amount,
    fee: transaction.fee,
    totalAmount: transaction.totalAmount,
    currency: {
      code: currency.code,
      name: currency.name,
    },
    message: transaction.message,
    status: transaction.status,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

function buildCustomerParty(customer) {
  if (!customer) {
    return null;
  }

  return {
    type: "customer",
    phone: customer && customer.phone,
    displayName: customer && customer.displayName,
    status: customer && customer.status,
  };
}

function buildProviderParty(provider) {
  if (!provider) {
    return null;
  }

  return {
    type: "provider",
    code: provider && provider.code,
    name: provider && provider.name,
    category: provider && provider.category,
    status: provider && provider.status,
  };
}

function buildReceiverParty(parties) {
  if (parties.receiverCustomer) {
    return buildCustomerParty(parties.receiverCustomer);
  }

  if (parties.receiverProvider) {
    return buildProviderParty(parties.receiverProvider);
  }

  return null;
}

async function findCustomerTransaction(customer, body) {
  const transactionId = CommonService.cleanString(
    body.id || body.transactionId,
  );
  const code = CommonService.cleanString(body.code);
  const transRefId = CommonService.cleanString(
    body.transRefId || body.TRANSREFID,
  );
  const customerId = String(customer.id);

  let criteria;
  if (transactionId) {
    criteria = { id: transactionId };
  } else if (code) {
    criteria = { code: code };
  } else if (transRefId) {
    criteria = { transRefId: transRefId };
  } else {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "TRANSACTION_IDENTIFIER_REQUIRED",
    );
  }

  const transaction = await Transaction.findOne(criteria);
  if (!transaction) {
    return null;
  }

  if (
    String(transaction.senderCustomer) !== customerId &&
    String(transaction.receiverCustomer) !== customerId
  ) {
    return null;
  }

  return transaction;
}

function buildFilterEcho(body) {
  return {
    type: body.type || body.direction,
    status: body.status,
    serviceId: body.serviceId,
    serviceCode: body.serviceCode,
    dateFrom: body.dateFrom || body.createdFrom,
    dateTo: body.dateTo || body.createdTo,
    amountFrom: body.amountFrom,
    amountTo: body.amountTo,
    totalAmountFrom: body.totalAmountFrom,
    totalAmountTo: body.totalAmountTo,
    q: body.q || body.search || body.keyword,
  };
}
