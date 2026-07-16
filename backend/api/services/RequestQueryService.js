module.exports = {
  normalizePaging: function (body, options) {
    body = CommonService.isPlainObject(body) ? body : {};
    options = options || {};

    var config = MiniWalletConfigService.pagination();
    var defaultPageSize = positiveInteger(
      options.defaultPageSize,
      config.defaultPageSize,
    );
    var maxPageSize = positiveInteger(
      options.maxPageSize,
      config.maxPageSize,
    );
    var page = positiveInteger(body.page, 1);
    var requestedPageSize = positiveInteger(
      body.pageSize || body.limit,
      defaultPageSize,
    );
    var pageSize = Math.min(requestedPageSize, maxPageSize);

    return {
      page: page,
      pageSize: pageSize,
      skip: (page - 1) * pageSize,
    };
  },

  pagination: function (paging, total) {
    return {
      page: paging.page,
      pageSize: paging.pageSize,
      total: total,
      totalPages: Math.ceil(total / paging.pageSize),
    };
  },

  normalizeSort: function (body, allowed, defaults) {
    body = CommonService.isPlainObject(body) ? body : {};
    defaults = defaults || {};

    var defaultField = defaults.field || allowed[0];
    var defaultOrder =
      CommonService.cleanUpperString(defaults.order, "DESC") === "ASC"
        ? "ASC"
        : "DESC";
    var requestedField = CommonService.cleanString(
      body.sortBy || defaultField,
    );
    var field =
      allowed.indexOf(requestedField) === -1
        ? defaultField
        : requestedField;
    var requestedOrder = CommonService.cleanUpperString(
      body.sortOrder || body.order,
      defaultOrder,
    );

    return {
      field: field,
      order: requestedOrder === "ASC" ? "ASC" : "DESC",
      waterline: field + " " + (requestedOrder === "ASC" ? "ASC" : "DESC"),
    };
  },
};

function positiveInteger(value, fallback) {
  var number = Number(value);
  return Number.isFinite(number) && number > 0
    ? Math.floor(number)
    : fallback;
}
