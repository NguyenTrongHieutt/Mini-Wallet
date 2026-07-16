module.exports = {
  list: async function (body) {
    body = CommonService.isPlainObject(body) ? body : {};
    const paging = normalizePaging(body);
    const criteria = await buildCriteria(body);
    const sort = normalizeSort(body);

    const total = await TransactionTrail.count(criteria);
    const trails = await TransactionTrail.find(criteria)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);
    const serviceMap = await loadServiceMap(trails);
    const items = trails.map(function (trail) {
      return buildTrail(trail, false, serviceMap[String(trail.serviceId)]);
    });

    return {
      items: items,
      pagination: paginationResult(paging, total),
      sort: sort,
    };
  },

  detail: async function (body) {
    body = CommonService.isPlainObject(body) ? body : {};
    const id = CommonService.cleanString(body.id || body.transRefId);
    if (!id) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "TRANSACTION_TRAIL_IDENTIFIER_REQUIRED",
      );
    }

    const trail = await TransactionTrail.findOne({ id: id });
    if (!trail) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "TRANSACTION_TRAIL_NOT_FOUND",
      );
    }

    const service = await Service.findOne({ id: trail.serviceId });
    return { trail: buildTrail(trail, true, service) };
  },
};

async function buildCriteria(body) {
  const criteria = {};
  const status = CommonService.cleanString(body.status).toLowerCase();
  if (status) criteria.status = status;

  const customerId = CommonService.cleanString(body.customerId);
  const officerId = CommonService.cleanString(body.officerId);
  if (customerId) criteria.customerId = customerId;
  if (officerId) criteria.officerId = officerId;

  const serviceId = await resolveServiceId(body);
  if (serviceId !== undefined) criteria.serviceId = serviceId;

  applyDateRange(
    criteria,
    body.dateFrom || body.createdFrom,
    body.dateTo || body.createdTo,
  );
  const q = CommonService.cleanString(body.q || body.search);
  if (q) {
    criteria.or = [
      { errorCode: { contains: q } },
      { errorMessage: { contains: q } },
    ];
  }
  return criteria;
}

async function resolveServiceId(body) {
  const serviceId = CommonService.cleanString(body.serviceId);
  if (serviceId) return serviceId;
  const serviceCode = CommonService.cleanUpperString(body.serviceCode);
  if (!serviceCode) return undefined;
  const service = await Service.findOne({ code: serviceCode });
  return service ? String(service.id) : null;
}

function buildTrail(trail, includeOutputMessage, service) {
  const item = {
    id: String(trail.id),
    service: service
      ? { id: String(service.id), code: service.code, name: service.name }
      : { id: String(trail.serviceId) },
    customerId: trail.customerId ? String(trail.customerId) : null,
    officerId: trail.officerId ? String(trail.officerId) : null,
    status: trail.status,
    expiredAt: trail.expiredAt,
    isExpired: Boolean(
      trail.expiredAt && new Date(trail.expiredAt).getTime() < Date.now(),
    ),
    errorCode: trail.errorCode || null,
    errorMessage: trail.errorMessage || null,
    createdBy: trail.createdBy,
    updatedBy: trail.updatedBy,
    createdAt: trail.createdAt,
    updatedAt: trail.updatedAt,
  };

  if (includeOutputMessage) {
    item.outputMessage = trail.outputMessage;
  }

  return item;
}

async function loadServiceMap(trails) {
  const ids = [];
  const seen = {};

  for (let i = 0; i < trails.length; i += 1) {
    const id = String(trails[i].serviceId);
    if (!seen[id]) {
      seen[id] = true;
      ids.push(id);
    }
  }

  if (!ids.length) {
    return {};
  }

  const services = await Service.find({ id: ids });
  return services.reduce(function (map, service) {
    map[String(service.id)] = service;
    return map;
  }, {});
}

function normalizePaging(body) {
  return RequestQueryService.normalizePaging(body);
}

function paginationResult(paging, total) {
  return RequestQueryService.pagination(paging, total);
}

function normalizeSort(body) {
  const allowed = ["createdAt", "updatedAt", "expiredAt", "status"];
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
