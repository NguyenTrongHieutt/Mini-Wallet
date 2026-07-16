const url = require("url");

module.exports = {
  MAX_PAGE_SIZE: 100,

  create: async function (body, officer) {
    body = CommonService.isPlainObject(body) ? body : {};
    const values = normalizeCreateInput(body);

    await ensureServiceExists(values.serviceCode);
    const currency = await Currency.loadActive(values.currencyCode);
    const existing = await findDuplicate(values.serviceCode, values.code);
    if (existing) {
      throw duplicateProviderError(existing);
    }

    const officerId = String(officer.id);
    const providerSeed = {
      type: values.type,
      code: values.code,
      serviceCode: values.serviceCode,
      name: values.name,
      category: values.category,
      requestUrl: values.requestUrl,
      confirmUrl: values.confirmUrl,
      verifyUrl: values.verifyUrl,
      status: "active",
      identityKey: buildIdentityKey(values.serviceCode, values.code),
      createdBy: officerId,
      updatedBy: officerId,
    };

    let provider;
    let pocket;
    try {
      provider = await Provider.create(providerSeed);

      const pocketSeed = {
        ownerType: "provider",
        ownerId: String(provider.id),
        currency: currency.id,
        balance: values.balance,
        name: values.pocketName,
        status: "active",
        createdBy: officerId,
        updatedBy: officerId,
      };
      pocketSeed.checksum = CryptoService.checksumPocket(pocketSeed);
      pocket = await Pocket.create(pocketSeed);

      const linked = await Provider.update(
        { id: provider.id },
        { pocketId: pocket.id, updatedBy: officerId },
      );
      if (!linked || !linked[0]) {
        throw AppErrorService.create(
          EnvelopeService.CODE.INVALID_STATE,
          "OFFICER_PROVIDER_CREATE_FAILED",
        );
      }

      provider = linked[0];
    } catch (err) {
      await rollbackCreate(provider, pocket);
      if (isDuplicateKeyError(err)) {
        const duplicate = await findDuplicate(values.serviceCode, values.code);
        throw duplicateProviderError(duplicate);
      }
      throw err;
    }

    return {
      provider: serializeProvider(provider, pocket, currency),
    };
  },

  list: async function (body) {
    body = CommonService.isPlainObject(body) ? body : {};
    const paging = normalizePaging(body);
    const criteria = buildCriteria(body);
    const sort = normalizeSort(body);
    const total = await Provider.count(criteria);
    const providers = await Provider.find(criteria)
      .populate("pocketId")
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);
    const currencies = await loadCurrencyMap(providers);

    return {
      items: providers.map(function (provider) {
        const pocket = populatedPocket(provider);
        return serializeProvider(
          provider,
          pocket,
          pocket ? currencies[String(pocket.currency)] : null,
        );
      }),
      pagination: buildPagination(paging, total),
      filters: {
        q: CommonService.cleanString(body.q || body.search || body.keyword),
        serviceCode:
          CommonService.cleanUpperString(body.serviceCode) || undefined,
        code:
          CommonService.cleanUpperString(body.providerCode || body.code) ||
          undefined,
        type: CommonService.cleanString(body.type).toLowerCase() || undefined,
        category:
          CommonService.cleanString(body.category).toLowerCase() || undefined,
        status:
          CommonService.cleanString(body.status).toLowerCase() || undefined,
      },
      sort: sort,
    };
  },

  detail: async function (body) {
    const provider = await findProvider(body, true);
    const pocket = populatedPocket(provider);
    const currency = pocket
      ? await Currency.findOne({ id: pocket.currency })
      : null;
    return { provider: serializeProvider(provider, pocket, currency) };
  },

  update: async function (body, officer) {
    body = CommonService.isPlainObject(body) ? body : {};
    const provider = await findProvider(body, false);
    const values = normalizeUpdateInput(body, provider);

    if (!values.hasUpdates) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "PROVIDER_UPDATE_REQUIRED",
      );
    }

    if (values.serviceCode !== provider.serviceCode) {
      await ensureServiceExists(values.serviceCode);
    }
    if (
      values.serviceCode !== provider.serviceCode ||
      values.code !== provider.code
    ) {
      const duplicate = await findDuplicate(values.serviceCode, values.code);
      if (duplicate && String(duplicate.id) !== String(provider.id)) {
        throw duplicateProviderError(duplicate);
      }
    }

    const updates = values.updates;
    updates.identityKey = buildIdentityKey(values.serviceCode, values.code);
    updates.updatedBy = String(officer.id);

    const changed = hasChanged(provider, updates, ["updatedBy", "identityKey"]);
    if (!changed && provider.identityKey === updates.identityKey) {
      return { provider: await loadSerializedProvider(provider.id), changed: false };
    }

    let updated;
    try {
      updated = await Provider.update({ id: provider.id }, updates);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const duplicate = await findDuplicate(values.serviceCode, values.code);
        throw duplicateProviderError(duplicate);
      }
      throw err;
    }
    if (!updated || !updated[0]) {
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        "OFFICER_PROVIDER_UPDATE_FAILED",
      );
    }

    return {
      provider: await loadSerializedProvider(provider.id),
      changed: changed,
    };
  },

  changeStatus: async function (body, officer, targetStatus) {
    if (["active", "inactive"].indexOf(targetStatus) === -1) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "PROVIDER_STATUS_INVALID",
      );
    }

    const provider = await findProvider(body, false);
    if (provider.status === targetStatus) {
      return {
        provider: await loadSerializedProvider(provider.id),
        changed: false,
      };
    }

    const updated = await Provider.update(
      { id: provider.id, status: provider.status },
      { status: targetStatus, updatedBy: String(officer.id) },
    );
    if (!updated || !updated[0]) {
      const current = await Provider.findOne({ id: provider.id });
      if (current && current.status === targetStatus) {
        return {
          provider: await loadSerializedProvider(provider.id),
          changed: false,
        };
      }
      throw AppErrorService.create(
        EnvelopeService.CODE.INVALID_STATE,
        targetStatus === "active"
          ? "PROVIDER_ACTIVATE_FAILED"
          : "PROVIDER_DEACTIVATE_FAILED",
      );
    }

    return {
      provider: await loadSerializedProvider(provider.id),
      changed: true,
    };
  },
};

function normalizeCreateInput(body) {
  const values = {
    type: normalizeType(body.type),
    code: normalizeProviderCode(body.providerCode || body.code),
    serviceCode: normalizeServiceCode(body.serviceCode),
    name: normalizeName(body.name),
    category: normalizeCategory(body.category),
    requestUrl: normalizeUrl(body.requestUrl, "requestUrl"),
    confirmUrl: normalizeUrl(body.confirmUrl, "confirmUrl"),
    verifyUrl: normalizeUrl(body.verifyUrl, "verifyUrl"),
    currencyCode: CommonService.cleanUpperString(body.currency, "VND"),
    balance:
      body.balance === undefined || body.balance === null ? 0 : body.balance,
  };

  validateRequiredProviderValues(values);
  if (!/^[A-Z]{3}$/.test(values.currencyCode)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "CURRENCY_FORMAT_INVALID",
    );
  }
  if (!Number.isSafeInteger(values.balance) || values.balance < 0) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_BALANCE_INVALID",
    );
  }

  values.pocketName = CommonService.cleanString(body.pocketName);
  if (!values.pocketName) values.pocketName = values.name + " Wallet";
  if (values.pocketName.length < 2 || values.pocketName.length > 100) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "POCKET_NAME_LENGTH_INVALID",
    );
  }
  return values;
}

function normalizeUpdateInput(body, provider) {
  const updates = {};
  let hasUpdates = false;

  function include(keys, name, normalizer) {
    let supplied = false;
    let raw;
    for (let i = 0; i < keys.length; i += 1) {
      if (Object.prototype.hasOwnProperty.call(body, keys[i])) {
        supplied = true;
        raw = body[keys[i]];
        break;
      }
    }
    if (supplied) {
      updates[name] = normalizer(raw);
      hasUpdates = true;
    }
  }

  include(["type"], "type", normalizeType);
  include(["providerCode", "code"], "code", normalizeProviderCode);
  include(["serviceCode"], "serviceCode", normalizeServiceCode);
  include(["name"], "name", normalizeName);
  include(["category"], "category", normalizeCategory);
  include(["requestUrl"], "requestUrl", function (value) {
    return normalizeUrl(value, "requestUrl");
  });
  include(["confirmUrl"], "confirmUrl", function (value) {
    return normalizeUrl(value, "confirmUrl");
  });
  include(["verifyUrl"], "verifyUrl", function (value) {
    return normalizeUrl(value, "verifyUrl");
  });

  const merged = {
    type: updates.type === undefined ? provider.type : updates.type,
    code: updates.code === undefined ? provider.code : updates.code,
    serviceCode:
      updates.serviceCode === undefined
        ? provider.serviceCode
        : updates.serviceCode,
    name: updates.name === undefined ? provider.name : updates.name,
    category:
      updates.category === undefined ? provider.category : updates.category,
  };
  validateRequiredProviderValues(merged);

  return {
    updates: updates,
    hasUpdates: hasUpdates,
    code: merged.code,
    serviceCode: merged.serviceCode,
  };
}

function normalizeType(value) {
  return CommonService.cleanString(value).toLowerCase();
}

function normalizeProviderCode(value) {
  return CommonService.cleanUpperString(value);
}

function normalizeServiceCode(value) {
  return CommonService.cleanUpperString(value);
}

function normalizeName(value) {
  return CommonService.cleanString(value);
}

function normalizeCategory(value) {
  return CommonService.cleanString(value).toLowerCase();
}

function normalizeUrl(value, field) {
  const normalized = CommonService.cleanString(value);
  if (!normalized) return "";

  const parsed = url.parse(normalized);
  if (
    normalized.length > 2048 ||
    ["http:", "https:"].indexOf(parsed.protocol) === -1 ||
    !parsed.hostname
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_URL_INVALID",
      { field: field },
    );
  }
  return normalized;
}

function validateRequiredProviderValues(values) {
  if (!values.type) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_TYPE_REQUIRED",
    );
  }
  if (!/^[a-z][a-z0-9_-]{1,49}$/.test(values.type)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_TYPE_INVALID",
    );
  }
  if (!values.code) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_CODE_REQUIRED",
    );
  }
  if (!/^[A-Z0-9][A-Z0-9_-]{1,49}$/.test(values.code)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_CODE_INVALID",
    );
  }
  if (!values.serviceCode) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "SERVICE_CODE_REQUIRED",
    );
  }
  if (!/^[A-Z0-9][A-Z0-9_-]{1,99}$/.test(values.serviceCode)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_SERVICE_CODE_INVALID",
    );
  }
  if (!values.name) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_NAME_REQUIRED",
    );
  }
  if (values.name.length < 2 || values.name.length > 100) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_NAME_LENGTH_INVALID",
    );
  }
  if (
    values.category &&
    !/^[a-z0-9][a-z0-9_-]{0,49}$/.test(values.category)
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_CATEGORY_INVALID",
    );
  }
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

function buildCriteria(body) {
  const criteria = {};
  const serviceCode = CommonService.cleanUpperString(body.serviceCode);
  const code = CommonService.cleanUpperString(body.providerCode || body.code);
  const type = CommonService.cleanString(body.type).toLowerCase();
  const category = CommonService.cleanString(body.category).toLowerCase();
  const status = CommonService.cleanString(body.status).toLowerCase();
  const search = CommonService.cleanString(
    body.q || body.search || body.keyword,
  );

  if (status && ["active", "inactive"].indexOf(status) === -1) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_STATUS_INVALID",
    );
  }
  if (serviceCode) criteria.serviceCode = serviceCode;
  if (code) criteria.code = code;
  if (type) criteria.type = type;
  if (category) criteria.category = category;
  if (status) criteria.status = status;
  if (search) {
    criteria.or = [
      { code: { contains: search } },
      { name: { contains: search } },
      { serviceCode: { contains: search } },
      { category: { contains: search } },
      { type: { contains: search } },
    ];
  }
  return criteria;
}

function normalizeSort(body) {
  const allowed = [
    "code",
    "serviceCode",
    "name",
    "category",
    "type",
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

function buildPagination(paging, total) {
  return {
    page: paging.page,
    pageSize: paging.pageSize,
    total: total,
    totalPages: Math.ceil(total / paging.pageSize),
  };
}

async function findProvider(body, populatePocket) {
  body = CommonService.isPlainObject(body) ? body : {};
  const providerId = CommonService.cleanString(body.providerId || body.id);
  const serviceCode = CommonService.cleanUpperString(body.serviceCode);
  const providerCode = CommonService.cleanUpperString(
    body.providerCode || body.code,
  );

  let criteria;
  if (providerId) {
    criteria = { id: providerId };
  } else if (serviceCode && providerCode) {
    criteria = { serviceCode: serviceCode, code: providerCode };
  } else {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "PROVIDER_IDENTIFIER_REQUIRED",
    );
  }

  let query = Provider.findOne(criteria);
  if (populatePocket) query = query.populate("pocketId");
  const provider = await query;
  if (!provider) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "PROVIDER_NOT_FOUND",
    );
  }
  return provider;
}

async function loadSerializedProvider(providerId) {
  const provider = await Provider.findOne({ id: providerId }).populate(
    "pocketId",
  );
  const pocket = populatedPocket(provider);
  const currency = pocket
    ? await Currency.findOne({ id: pocket.currency })
    : null;
  return serializeProvider(provider, pocket, currency);
}

function populatedPocket(provider) {
  return provider && provider.pocketId && typeof provider.pocketId === "object"
    ? provider.pocketId
    : null;
}

async function loadCurrencyMap(providers) {
  const ids = [];
  const seen = {};
  providers.forEach(function (provider) {
    const pocket = populatedPocket(provider);
    const id = pocket && pocket.currency ? String(pocket.currency) : "";
    if (id && !seen[id]) {
      seen[id] = true;
      ids.push(pocket.currency);
    }
  });
  if (!ids.length) return {};

  const currencies = await Currency.find({ id: ids });
  const map = {};
  currencies.forEach(function (currency) {
    map[String(currency.id)] = currency;
  });
  return map;
}

function serializeProvider(provider, pocket, currency) {
  return {
    id: String(provider.id),
    type: provider.type,
    code: provider.code,
    serviceCode: provider.serviceCode,
    name: provider.name,
    category: provider.category || null,
    requestUrl: provider.requestUrl || null,
    confirmUrl: provider.confirmUrl || null,
    verifyUrl: provider.verifyUrl || null,
    status: provider.status,
    pocketId: pocket ? String(pocket.id) : null,
    pocket: pocket
      ? {
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
            : pocket.currency,
          status: pocket.status,
        }
      : null,
    createdBy: provider.createdBy,
    updatedBy: provider.updatedBy,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

async function ensureServiceExists(serviceCode) {
  const service = await Service.findOne({ code: serviceCode });
  if (!service) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "SERVICE_NOT_FOUND",
      { serviceCode: serviceCode },
    );
  }
  return service;
}

function findDuplicate(serviceCode, providerCode) {
  return Provider.findOne({ serviceCode: serviceCode, code: providerCode });
}

function duplicateProviderError(provider) {
  return AppErrorService.create(
    EnvelopeService.CODE.CONFLICT,
    "PROVIDER_ALREADY_EXISTS",
    provider ? { providerId: String(provider.id) } : undefined,
  );
}

function buildIdentityKey(serviceCode, providerCode) {
  return serviceCode + "::" + providerCode;
}

function hasChanged(record, updates, ignored) {
  const ignoredMap = {};
  ignored.forEach(function (key) {
    ignoredMap[key] = true;
  });
  return Object.keys(updates).some(function (key) {
    if (ignoredMap[key]) return false;
    return String(record[key] || "") !== String(updates[key] || "");
  });
}

async function rollbackCreate(provider, pocket) {
  try {
    if (pocket && pocket.id) await Pocket.destroy({ id: pocket.id });
  } catch (pocketErr) {
    sails.log.error("Failed to rollback provider pocket", pocketErr);
  }
  try {
    if (provider && provider.id) await Provider.destroy({ id: provider.id });
  } catch (providerErr) {
    sails.log.error("Failed to rollback provider", providerErr);
  }
}

function isDuplicateKeyError(err) {
  if (!err) return false;
  if (Number(err.code) === 11000 || Number(err.code) === 11001) return true;
  if (/E11000|duplicate key/i.test(err.message || "")) return true;
  const nested = err.originalError || err.raw || err.cause;
  return nested && nested !== err ? isDuplicateKeyError(nested) : false;
}
