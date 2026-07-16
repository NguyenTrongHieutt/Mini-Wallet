var DOMAIN = require("../../config/domain").domain;

module.exports = {
  list: async function (body) {
    body = CommonService.isPlainObject(body) ? body : {};

    const paging = normalizePaging(body);
    const criteria = buildCriteria(body);
    const sort = normalizeSort(body);
    const total = await Customer.count(criteria);
    const customers = await Customer.find(criteria)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.pageSize);

    return {
      items: customers.map(AuthService.publicUser.bind(AuthService)),
      pagination: {
        page: paging.page,
        pageSize: paging.pageSize,
        total: total,
        totalPages: Math.ceil(total / paging.pageSize),
      },
      filters: {
        q: CommonService.cleanString(body.q || body.search || body.keyword),
        status: CommonService.cleanString(body.status).toLowerCase() || undefined,
      },
      sort: sort,
    };
  },

  detail: async function (body) {
    const customer = await findCustomer(body);
    const pockets = await Pocket.find({
      ownerType: DOMAIN.ownerType.CUSTOMER,
      ownerId: String(customer.id),
    }).populate("currency");

    return {
      customer: AuthService.publicUser(customer),
      pockets: pockets.map(function (pocket) {
        return AuthService.publicPocket(pocket, pocket.currency);
      }),
    };
  },

  changeStatus: async function (body, officer, targetStatus) {
    const customer = await findCustomer(body);
    const sourceStatus =
      targetStatus === DOMAIN.status.LOCKED
        ? DOMAIN.status.ACTIVE
        : DOMAIN.status.LOCKED;
    let changed = false;

    if (customer.status !== targetStatus) {
      const updated = await Customer.update(
        { id: customer.id, status: sourceStatus },
        {
          status: targetStatus,
          updatedBy: String(officer.id),
        },
      );

      if (!updated || !updated[0]) {
        const current = await Customer.findOne({ id: customer.id });
        if (!current || current.status !== targetStatus) {
          throw AppErrorService.create(
            EnvelopeService.CODE.INVALID_STATE,
            targetStatus === DOMAIN.status.LOCKED
              ? "CUSTOMER_LOCK_FAILED"
              : "CUSTOMER_UNLOCK_FAILED",
          );
        }
        customer.status = current.status;
        customer.updatedAt = current.updatedAt;
        customer.updatedBy = current.updatedBy;
      } else {
        Object.assign(customer, updated[0]);
        changed = true;
      }
    }

    if (targetStatus === DOMAIN.status.LOCKED) {
      await Session.update(
        {
          userType: DOMAIN.userType.CUSTOMER,
          userId: String(customer.id),
          status: DOMAIN.status.ACTIVE,
        },
        {
          status: DOMAIN.status.REVOKED,
          updatedBy: String(officer.id),
        },
      );
    }

    return {
      customer: AuthService.publicUser(customer),
      changed: changed,
    };
  },
};

function normalizePaging(body) {
  return RequestQueryService.normalizePaging(body);
}

function buildCriteria(body) {
  const criteria = {};
  const status = CommonService.cleanString(body.status).toLowerCase();
  const search = CommonService.cleanString(
    body.q || body.search || body.keyword,
  );

  if (
    status &&
    [DOMAIN.status.ACTIVE, DOMAIN.status.LOCKED].indexOf(status) === -1
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "CUSTOMER_STATUS_INVALID",
    );
  }
  if (status) {
    criteria.status = status;
  }
  if (search) {
    criteria.or = [
      { phone: { contains: search } },
      { displayName: { contains: search } },
    ];
  }

  return criteria;
}

function normalizeSort(body) {
  const allowed = ["phone", "displayName", "status", "createdAt", "updatedAt"];
  const requested = CommonService.cleanString(body.sortBy || "createdAt");
  const field = allowed.indexOf(requested) === -1 ? "createdAt" : requested;
  const direction = CommonService.cleanString(
    body.sortOrder || body.order || "DESC",
  ).toUpperCase();

  return field + " " + (direction === "ASC" ? "ASC" : "DESC");
}

async function findCustomer(body) {
  body = CommonService.isPlainObject(body) ? body : {};
  const customerId = CommonService.cleanString(body.customerId || body.id);
  const phone = CommonService.cleanString(body.phone);

  if (!customerId && !phone) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "CUSTOMER_IDENTIFIER_REQUIRED",
    );
  }

  const customer = customerId
    ? await Customer.findOne({ id: customerId })
    : await Customer.findOne({ phone: phone });

  if (!customer) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "CUSTOMER_NOT_FOUND",
    );
  }

  return customer;
}
